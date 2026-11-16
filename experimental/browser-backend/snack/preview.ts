/* eslint-disable import/no-duplicates -- Side-effect hook must precede renderer-loading adapters. */
// Install the refresh hook before any adapter can import a React renderer.
import './refresh-setup';
import * as ExpoUI from '@expo/ui';
import * as ExpoAudio from 'expo-audio';
import * as ExpoFontModule from 'expo-font';
import * as ExpoImage from 'expo-image';
import * as LinearGradient from 'expo-linear-gradient';
import * as ExpoVideo from 'expo-video';
import React from 'react';
import * as JSX from 'react/jsx-runtime';
import * as ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import * as GestureHandler from 'react-native-gesture-handler';
import Animated, * as Reanimated from 'react-native-reanimated';
import * as SafeArea from 'react-native-safe-area-context';
import SvgDefault, * as SVG from 'react-native-svg';
import * as RN from 'react-native-web';
import * as Worklets from 'react-native-worklets';
import { createFromReadableStream } from 'react-server-dom-webpack/client.browser';

import { diagnose } from './diagnostics';
import { lockDocument, removeCapabilities } from './lockdown';
import { createLoader } from './module-runtime';
import { Refresh } from './refresh-setup';
import type { ClientGraph } from './types';
import { createFontRuntime } from '../../../runtime/src/worker/font-runtime';
type PreviewCommand =
  | { type: 'render'; request: number; client: ClientGraph; flight: string }
  | { type: 'action-result'; request: number; clientHash: string; flight: string; error?: string };
type BoundaryProps = { revision: number; children?: React.ReactNode };
type BoundaryState = { error: unknown; revision: number };
declare global {
  var __rscModules: Record<string, unknown>;
}
lockDocument();
removeCapabilities(globalThis, ['Worker']);
const rootElement = document.getElementById('root');
if (!rootElement) throw Error('Missing preview root');
const root = createRoot(rootElement);
let port: MessagePort | undefined;
let registry: Record<string, unknown> = {};
let hash = '',
  sequence = 0,
  renderSequence = 0;
const ExpoFont = createFontRuntime(ExpoFontModule, React);
const actions = new Map<
  number,
  {
    resolve: (value: React.ReactNode) => void;
    reject: (error: unknown) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
globalThis.__rscModules = registry;
let renderFailure: unknown;
let refreshingPreviousTree = false;
class PreviewBoundary extends React.Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, revision: 0 };
  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState) {
    return props.revision !== state.revision ? { error: null, revision: props.revision } : null;
  }
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  componentDidCatch(error: unknown) {
    renderFailure = error;
    if (!refreshingPreviousTree) port?.postMessage({ type: 'runtime-error', error: String(error) });
  }
  render() {
    return this.state.error
      ? React.createElement('pre', null, String(this.state.error))
      : this.props.children;
  }
}
function callServer(id: string, args: unknown[]): Promise<React.ReactNode> {
  if (actions.size >= 16) return Promise.reject(Error('Too many pending actions'));
  return new Promise<React.ReactNode>((resolve, reject) => {
    const request = ++sequence;
    const timer = setTimeout(() => {
      actions.delete(request);
      reject(Error('Action timed out'));
    }, 20000);
    actions.set(request, { resolve, reject, timer });
    port!.postMessage({ type: 'action', request, id, args, clientHash: hash });
  });
}
async function decode(flight: string) {
  return (await createFromReadableStream(new Response(flight).body!, { callServer }))._value;
}
async function install(client: ClientGraph, sequence: number) {
  if (client.hash === hash) return;
  for (const item of actions.values()) {
    clearTimeout(item.timer);
    item.reject(Error('Client registry changed'));
  }
  actions.clear();
  document.querySelectorAll('style[data-rsc-style]').forEach((node) => node.remove());
  const runtime = {
    '@empty': {},
    '@react': React,
    '@react/jsx-runtime': JSX,
    '@react/jsx-dev-runtime': JSX,
    '@react-native': RN,
    '@react-native-safe-area-context': SafeArea,
    '@@expo/ui': ExpoUI,
    '@expo-font': ExpoFont,
    '@expo-image': ExpoImage,
    '@expo-audio': ExpoAudio,
    '@expo-video': ExpoVideo,
    '@react-native-svg': { ...SVG, default: SvgDefault, __esModule: true },
    '@expo-linear-gradient': LinearGradient,
    '@react-native-gesture-handler': GestureHandler,
    '@react-native-reanimated': { ...Reanimated, default: Animated, __esModule: true },
    '@react-native-worklets': Worklets,
    '@react-dom': ReactDOM,
  };
  const registrations: [unknown, string][] = [];
  const loader = createLoader(
    client.modules,
    runtime,
    React,
    (record, module) => {
      if (record.actions) {
        module.exports = Object.fromEntries(
          record.actions.map(({ id, name }) => [
            name,
            (...args: unknown[]) => callServer(id, args),
          ]),
        );
        Object.defineProperty(module.exports, '__esModule', { value: true });
        return true;
      }
      if (record.css !== undefined) {
        const style = document.createElement('style');
        style.dataset.rscStyle = 'true';
        style.textContent = record.css;
        document.head.append(style);
        module.exports = record.classes || {};
        return true;
      }
      return false;
    },
    {
      register: (type, id) => {
        registrations.push([type, id]);
      },
      createSignatureFunctionForTransform: Refresh.createSignatureFunctionForTransform,
    },
  );
  const refs: Record<string, unknown> = {};
  for (const [id, { file, names }] of Object.entries(client.roots)) {
    const mod = await loader.loadAsync(file);
    for (const name of names)
      if (
        !mod ||
        (typeof mod !== 'object' && typeof mod !== 'function') ||
        !Object.hasOwn(mod, name)
      )
        throw Error('Missing client export ' + name);
    refs[id] = mod;
  }
  if (sequence !== renderSequence) throw Error('Stale preview install discarded');
  for (const [type, id] of registrations) Refresh.register(type, id);
  registry = refs;
  globalThis.__rscModules = refs;
  hash = client.hash;
}
window.addEventListener('message', (event) => {
  if (event.source !== parent || event.data?.type !== 'connect' || !event.ports[0] || port) return;
  port = event.ports[0];
  port.onmessage = async ({ data }: MessageEvent<PreviewCommand>) => {
    try {
      if (data.type === 'render') {
        const seq = ++renderSequence;
        await install(data.client, seq);
        const tree = await decode(data.flight);
        if (seq === renderSequence) {
          // Refresh may retry a failed component that the new Flight tree removes.
          // Only the replacement tree determines whether this render succeeded.
          refreshingPreviousTree = true;
          try {
            ReactDOM.flushSync(() => Refresh.performReactRefresh());
          } catch {
            // A failed old root is retried by rendering the replacement below.
          } finally {
            refreshingPreviousTree = false;
          }
          renderFailure = null;
          ReactDOM.flushSync(() =>
            root.render(React.createElement(PreviewBoundary, { revision: seq }, tree)),
          );
          if (renderFailure) throw renderFailure;
          port!.postMessage({ type: 'paint', request: data.request });
        }
      } else if (data.type === 'action-result') {
        const item = actions.get(data.request);
        actions.delete(data.request);
        if (!item) return;
        clearTimeout(item.timer);
        if (data.error) item.reject(Error(data.error));
        else if (data.clientHash !== hash) item.reject(Error('Stale action response'));
        else item.resolve(await decode(data.flight));
      }
    } catch (e) {
      port!.postMessage({
        type: 'error',
        error: String(e),
        diagnostic: diagnose(e, data.type === 'render' ? data.client.modules : {}),
        request: data.request,
      });
    }
  };
  port.start();
  port!.postMessage({ type: 'ready' });
});

/* global TextEncoder, ReadableStream */
/// <reference path="./font-loader.d.ts" />
import * as ExpoUI from '@expo/ui';
import * as ExpoAudio from 'expo-audio';
import * as ExpoFontModule from 'expo-font';
import { loadFontFamilyAsync } from 'expo-font/build/FontLoader';
import * as ExpoImage from 'expo-image';
import * as LinearGradient from 'expo-linear-gradient';
import * as ExpoVideo from 'expo-video';
import React from 'react';
import * as JSX from 'react/jsx-runtime';
import * as RN from 'react-native';
import * as GestureHandler from 'react-native-gesture-handler';
import Animated, * as Reanimated from 'react-native-reanimated';
import * as SafeArea from 'react-native-safe-area-context';
import SvgDefault, * as SVG from 'react-native-svg';
import * as Worklets from 'react-native-worklets';

import { createFontRuntime } from './font-runtime';
import { prepareAssets } from './runtime-assets';
// Production EAS updates use full remounts; static development exports support Fast Refresh.
const Refresh = __DEV__ ? require('react-refresh/runtime') : null;

const ExpoFont = createFontRuntime(ExpoFontModule, React, (family, value, definitions) =>
  loadFontFamilyAsync(
    family,
    definitions ? value.flatMap((item) => item.fontDefinitions) : [{ path: value }],
  ),
);
const registry = {};
globalThis.__snackRequire = (id) => {
  if (!Object.hasOwn(registry, id)) throw Error('Missing client reference ' + id);
  return registry[id];
};
globalThis.__snackRequire.u = (id) => id;
const { createFromReadableStream } = require('./flight-client');
export function createNativeRuntime(callServer) {
  let hash = '';
  const namespace = (m) => (m?.__esModule ? m : { ...m, default: m });
  const defaultValue = (m) => (m?.__esModule ? m.default : m);
  async function install(client) {
    if (hash === client.hash) {
      (await prepareAssets(client.modules)).commit();
      return;
    }
    const registrations = [];
    const cache = new Map(),
      pending = new Map(),
      runtime = {
        '@empty': {},
        '@react': React,
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
        '@react/jsx-runtime': JSX,
        '@react/jsx-dev-runtime': JSX,
      };
    const records = client.modules;
    const assets = await prepareAssets(records);
    function evaluate(file, module) {
      const record = records[file];
      if (record.actions) {
        module.exports = Object.fromEntries(
          record.actions.map(({ id, name }) => [name, (...args) => callServer(id, args)]),
        );
        Object.defineProperty(module.exports, '__esModule', { value: true });
        return;
      }
      if (record.json !== undefined) {
        module.exports = record.json;
        return;
      }
      if (record.asset) {
        module.exports = assets.sources[file];
        return;
      }
      if (record.css !== undefined) throw Error('CSS is not supported in the native preview');
      const resolve = (spec) => {
        if (!Object.hasOwn(record.deps, spec)) throw Error('Undeclared import ' + spec);
        return record.deps[spec];
      };
      const require = (spec) => load(resolve(spec));
      require.resolve = resolve;
      const Factory = record.async
        ? Object.getPrototypeOf(async function () {}).constructor
        : Function;
      return new Factory(
        '__DEV__',
        'require',
        'module',
        'exports',
        'React',
        'process',
        'global',
        '__rsc_import__',
        '__rsc_load__',
        '__rsc_context__',
        '__metroDefault',
        '__metroAll',
        '__metroDefaultValue',
        '__metroAllValue',
        '$RefreshReg$',
        '$RefreshSig$',
        record.code + '\n//# sourceURL=snack:' + file,
      )(
        false,
        require,
        module,
        module.exports,
        React,
        { env: { NODE_ENV: 'production' } },
        globalThis,
        (spec) => loadAsync(resolve(spec)).then(namespace),
        (spec) => loadAsync(resolve(spec)),
        (choices, spec) => {
          if (!Object.hasOwn(choices, spec)) throw Error('Unknown context');
          return choices[spec];
        },
        (spec) => defaultValue(require(spec)),
        (spec) => namespace(require(spec)),
        defaultValue,
        namespace,
        (type, id) => registrations.push([type, file + ' ' + id]),
        () => (Refresh ? Refresh.createSignatureFunctionForTransform() : (type) => type),
      );
    }
    function load(file) {
      if (Object.hasOwn(runtime, file)) return runtime[file];
      if (!records[file]) throw Error('Unsupported native runtime import ' + file);
      if (records[file].async) throw Error('Use import for async module');
      if (cache.has(file)) return cache.get(file).exports;
      const module = { exports: {} };
      cache.set(file, module);
      try {
        evaluate(file, module);
        return module.exports;
      } catch (error) {
        cache.delete(file);
        throw error;
      }
    }
    function loadAsync(file) {
      if (Object.hasOwn(runtime, file) || !records[file]?.async) return Promise.resolve(load(file));
      if (pending.has(file)) return pending.get(file);
      const module = { exports: {} };
      cache.set(file, module);
      const promise = Promise.resolve()
        .then(() => evaluate(file, module))
        .then(
          () => module.exports,
          (error) => {
            cache.delete(file);
            pending.delete(file);
            throw error;
          },
        );
      pending.set(file, promise);
      return promise;
    }
    const next = {};
    for (const [id, root] of Object.entries(client.roots)) next[id] = await loadAsync(root.file);
    for (const id of Object.keys(registry)) delete registry[id];
    Object.assign(registry, next);
    assets.commit();
    for (const [type, id] of registrations) Refresh?.register(type, id);
    hash = client.hash;
  }
  async function decode(flight) {
    const bytes = new TextEncoder().encode(flight);
    return (
      await createFromReadableStream(
        new ReadableStream({
          start(c) {
            c.enqueue(bytes);
            c.close();
          },
        }),
        { callServer },
      )
    )._value;
  }
  return {
    install,
    decode,
    supportsRefresh: !!Refresh,
    refresh: () => {
      try {
        Refresh?.performReactRefresh();
      } catch {
        // Retry with the replacement tree if React revisits a failed old root.
      }
    },
    callServer,
    getHash: () => hash,
  };
}

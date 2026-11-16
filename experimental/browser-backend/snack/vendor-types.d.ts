declare module 'path-browserify' {
  import { posix } from 'path';
  export default posix;
}
declare module '@babel/standalone' {
  import type { InputOptions, FileResult } from '@babel/core';
  import type { Node } from '@babel/types';
  type StandaloneOptions = Omit<InputOptions, 'inputSourceMap' | 'caller'> & {
    inputSourceMap?: InputOptions['inputSourceMap'] | FileResult['map'];
    caller?: { name: string; [key: string]: string | boolean | number };
  };
  type Result = Omit<FileResult, 'code' | 'metadata'> & {
    code: string;
    metadata: { reactServerActions?: { names: string[] } };
  };
  export function transform(source: string, options: StandaloneOptions): Result;
  export function transformFromAst(
    ast: Node | null | undefined,
    source: string,
    options: StandaloneOptions,
  ): Result;
}
declare module 'worklets-transform' {
  const plugin: import('@babel/core').PluginTarget;
  export default plugin;
}
declare module 'expo-cache-transform' {
  export const reactUseCachePlugin: import('@babel/core').PluginTarget;
}
declare module 'expo-actions-transform' {
  export const reactServerActionsPlugin: import('@babel/core').PluginTarget;
}
declare module 'metro-transform-plugins/private/import-export-plugin' {
  const plugin: import('@babel/core').PluginTarget;
  export default plugin;
}
declare module 'metro-transform-plugins/private/inline-plugin' {
  const plugin: import('@babel/core').PluginTarget;
  export default plugin;
}
// These namespaces are passed through to user modules; this adapter does not invoke their APIs.
declare module 'react-native-reanimated' {
  const value: Record<string, unknown>;
  export = value;
}
declare module 'react-native-worklets' {
  const value: Record<string, unknown>;
  export = value;
}
declare module 'react-native-gesture-handler' {
  const value: Record<string, unknown>;
  export = value;
}
declare module 'react-native-svg' {
  const value: Record<string, unknown>;
  export = value;
}
declare module 'expo-linear-gradient' {
  const value: Record<string, unknown>;
  export = value;
}
declare module 'react-native-safe-area-context' {
  const value: Record<string, unknown>;
  export = value;
}
declare module 'expo-font' {
  const value: Record<string, unknown>;
  export = value;
}
declare module '@expo/ui' {
  const value: Record<string, unknown>;
  export = value;
}
declare module 'react-native-web' {
  const value: Record<string, unknown>;
  export = value;
}
declare module 'react-server-dom-webpack/client.browser' {
  export function createFromReadableStream(
    stream: ReadableStream<Uint8Array>,
    options: { callServer: (id: string, args: unknown[]) => Promise<import('react').ReactNode> },
  ): Promise<{ _value: import('react').ReactNode }>;
}

declare module 'react-refresh/babel' {
  const plugin: import('@babel/core').PluginTarget;
  export default plugin;
}
declare module 'react-refresh/runtime' {
  export function injectIntoGlobalHook(target: typeof globalThis): void;
  export function register(type: unknown, id: string): void;
  export function createSignatureFunctionForTransform(): (
    type: unknown,
    key?: string,
    forceReset?: boolean,
    getCustomHooks?: () => unknown[],
  ) => unknown;
  export function performReactRefresh(): unknown;
}

declare module 'expo-image' {
  const value: Record<string, unknown>;
  export = value;
}

declare module 'expo-audio' {
  const value: Record<string, unknown>;
  export = value;
}

declare module 'expo-video' {
  const value: Record<string, unknown>;
  export = value;
}

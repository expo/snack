import * as babel from '@babel/core';
import { snackRequireContextVirtualModuleBabelPlugin } from 'snack-require-context/snackager';

import RewriteImportsPlugin from './bundler/RewriteImportsPlugin';

const template = `
import "@expo/metro-runtime";

import { ExpoRoot } from "expo-router";
import Head from "expo-router/head";
import { renderRootComponent } from "expo-router/src/renderRootComponent";

const ctx = require.context(
  process.env.EXPO_ROUTER_APP_ROOT,
  true,
  /.*/,
  process.env.EXPO_ROUTER_IMPORT_MODE
);

// Must be exported or Fast Refresh won't update the context
export function App() {
  return (
    <Head.Provider>
      <ExpoRoot context={ctx} />
    </Head.Provider>
  );
}

renderRootComponent(App);
`;

function test() {
  const result = babel.transform(template, {
    filename: 'expo-router/entry.js',
    babelrc: false,
    configFile: false,
    presets: [require.resolve('metro-react-native-babel-preset')],
    plugins: [
      RewriteImportsPlugin,
      require.resolve('@babel/plugin-proposal-export-namespace-from'),
      [snackRequireContextVirtualModuleBabelPlugin],
    ],
  });

  console.log(result?.code);
}

test();

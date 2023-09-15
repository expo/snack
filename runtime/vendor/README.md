# Vendored libraries

## SystemJS

We vendor SystemJS because it doesn't run in React Native by default. We have done the following changes in the vendored code:

1. Replaced code that assigned baseURI to `document.baseURI` so we can run the app in the chrome debugger.
2. Removed all dynamic `require` expressions so that React Native packager can  bundle the code.
3. Removed SystemJS's node detection stuff so it doesn't try to require node native modules.
4. Removed requiring node native modules such as 'fs'.
5. Replaced the `eval` with a `global.evaluate` which we assign in `Modules.js`.

## Babel Standalone

We vendor Babel Standalone for 2 reasons:

1. We want to remove all the plugins and presets bundled by default, otherwise metro takes forever for the build.
2. When including the plugins and presets we need, we want to mock node built-ins and hence need to run it through webpack. We can include them in the same build pipeline for the bundle.

The script for building exists at: [expo/babel-standalone](https://github.com/expo/babel-standalone)

## Reanimated Babel plugin

We need to transpile user provided code to evaluatable using Babel. If this code contains Reanimated, we need to use the Babel plugin. This fork of the Reanimated plugin "rewires" the Babel imports to use our "Babel Standalone" version, which is capable of executing inside React Native.

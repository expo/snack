# Vendored libraries

## SystemJS

We vendor SystemJS because it doesn't run in React Native by default. We have done the following changes in the vendored code:

1. Replaced code that assigned baseURI to `document.baseURI` so we can run the app in the chrome debugger.
2. Removed all dynamic `require` expressions so that React Native packager can  bundle the code.
3. Removed SystemJS's node detection stuff so it doesn't try to require node native modules.
4. Removed requiring node native modules such as 'fs'.
5. Replaced the `eval` with a `global.evaluate` which we assign in `Modules.js`.

## Reanimated Babel Plugin

The `react-native-reanimated` babel plugin is required to use Reanimated inside a React Native project.
But, due to the nature of Snack, we need to do this two times:

1. For the Snack Runtime app, which is an Expo project that works inside Expo Go.
2. For user-provided code through the Snack infrastructure.

We can use the default babel plugin for step 1, but for step 2, we need to "rewire" the plugin to use `snack-babel-standalone`.
Babel normally isn't available inside an app, but this version of babel is built to be portable into any environment.
The plugin needs to use this portable babel version inside the app.

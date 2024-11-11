import { registerPlugins, registerPresets } from './registry';

registerPlugins({
  '@babel/plugin-proposal-decorators': require('@babel/plugin-proposal-decorators').default,
  // Required to map `await import()` back to `require`, which works in systemjs
  '@babel/plugin-syntax-dynamic-import': require('@babel/plugin-syntax-dynamic-import'),
  '@babel/plugin-proposal-dynamic-import': require('@babel/plugin-proposal-dynamic-import'),
  // Required to skip the `import React from 'react';`
  '@babel/plugin-transform-react-jsx': require('@babel/plugin-transform-react-jsx'),
  // Required for using JSI host objects with async functions in React Native <=0.66
  '@babel/plugin-transform-async-to-generator': require('@babel/plugin-transform-async-to-generator').default,
  // Required for the Reanimated +2.3.x plugin
  '@babel/plugin-transform-shorthand-properties': require('@babel/plugin-transform-shorthand-properties').default,
  '@babel/plugin-transform-arrow-functions': require('@babel/plugin-transform-arrow-functions').default,
  '@babel/plugin-proposal-optional-chaining': require('@babel/plugin-proposal-optional-chaining').default,
  '@babel/plugin-proposal-nullish-coalescing-operator': require('@babel/plugin-proposal-nullish-coalescing-operator').default,
  '@babel/plugin-transform-template-literals': require('@babel/plugin-transform-template-literals').default,
  // Required for the Reanimated +3.16.x plugin
  '@babel/plugin-transform-optional-chaining': require('@babel/plugin-transform-optional-chaining').default,
  '@babel/plugin-transform-nullish-coalescing-operator': require('@babel/plugin-transform-nullish-coalescing-operator').default,
  '@babel/plugin-transform-class-properties': require('@babel/plugin-transform-class-properties'),
  '@babel/plugin-transform-classes': require('@babel/plugin-transform-classes'),
  '@babel/plugin-transform-unicode-regex': require('@babel/plugin-transform-unicode-regex'),
});

registerPresets({
  '@react-native/babel-preset': require('@react-native/babel-preset').getPreset(null, {
    enableBabelRuntime: false,
  }),
  // Required for the Reanimated +2.3.x plugin
  '@babel/preset-typescript': require('@babel/preset-typescript').default,
});

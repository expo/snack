# snack-babel-standalone

Standalone version of Babel used in Snack Runtime and Snack Website. This version of Babel is bundled with various presets and plugins for React Native. It's optimized to parse or transform code at runtime.

> Note, this package is decoupled from the yarn workspaces to prevent possible mutliple babel versions being bundled.

## Bundled plugins

- `@babel/core`
- `@babel/plugin-proposal-decorators`
- `@babel/plugin-proposal-dynamic-import`
- `@babel/plugin-proposal-nullish-coalescing-operator`
- `@babel/plugin-proposal-optional-chaining`
- `@babel/plugin-syntax-dynamic-import`
- `@babel/plugin-transform-arrow-functions`
- `@babel/plugin-transform-async-to-generator`
- `@babel/plugin-transform-shorthand-properties`
- `@babel/plugin-transform-template-literals`
- `@babel/preset-typescript`
- `metro-react-native-babel-preset`

## Installation

```bash
$ yarn add snack-babel-standalone
```

## Usage

```js
import * as babel from 'snack-babel-standalone';

const filename = 'test.js';
const code = `...`;

const result = babel.transform(code, {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['@babel/plugin-transform-async-to-generator'],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    // Other plugins
  ],
  moduleIds: false,
  sourceMaps: true,
  compact: false,
  filename,
  sourceFileName: filename,
});
```

## Caveats

Because this package is used in both the Snack Runtime, and as drop-in replacement for `@babel/core` in `snack-eslint-standalone`, we are using two separate entrypoints.

- `snack-babel-standalone` → Default entrypoint and loads `./src/runtime.ts`.
- `snack-babel-standalone/eslint` → `@babel/core` replacement for `@babel/eslint-parser` in [`snack-eslint-standalone`](../snack-eslint-standalone/README.md).

> Keep these two entrypoints separated as much as possible, doing so will keep unnecessary code out of both bundles.

## Contributing

This package has a few commands, mainly to build, analyze and build for publishing.

- `yarn dev` → Builds an unoptimized development build.
- `yarn build` → Builds an optimized production build.
- `yarn analyze` → Builds an optimized production build, and opens the Webpack bundle analyzer.

> When adding new packages, or upgrading old ones, make sure no Node dependencies are added with `yarn analyze`. Also make sure only the minimum required code is being bundled, create patches if necessary.

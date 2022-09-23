# snack-eslint-standalone

Standalone version of ESLint used in the Snack Website. This version of ESLint is bundled with the `@babel/eslint-parser` and various rules. It's based on [the ESLint playground](https://github.com/eslint/playground/blob/23bea25563ee62306ede0ade6e0a8641979ed84a/src/playground/App.js#L8) and optimized to run inside the browser.

## Bundled parser

- `@babel/eslint-parser@7.14.2` → This is the last version before the worker threads were implemented. It's super hard to bundle that, so we capped it at this version.
- `@babel/core` = `snack-babel-standalone/eslint` → We swapped out `@babel/core` with this standalone version to properly resolve the presets and plugins for Babel.

## Bundled plugins

- `eslint-plugin-react` → We use a patch to disable the React version detection, it's using Node dependencies and we can't bundle that in the browser.
- `eslint-plugin-react-hooks` → _Bundled as is._
- `eslint-plugin-react-native` → _Bundled as is._

## Installation

```bash
$ yarn add snack-eslint-standalone
```

## Usage

```ts
import type { LintMessage } from 'snack-eslint-standalone';
import { linter, defaultConfig } from 'snack-eslint-standalone';

const code = `
  function App() {
    return (
      <View>
        <Text>Hello!</Text>
      </View>
    );
  }
`;

// The file name is important to enable certain presets in babel
const result: LintMessage[] = linter.verify(code, defaultConfig, { filename: '...' });
```

## Caveats

Because both `eslint` and `@babel/eslint-parser` weren't built to run inside the browser, we have to do a few tricks to make this work.

### Babel parser

Babel is a huge library and runs mostly outside the browsers. To make the presets and plugins we need _actually work_, we need to bundle them with the babel parser. This is done by swapping out `@babel/core` with `snack-babel-standalone/eslint`.

Because we need to run Babel inside the Snack Runtime, we already have a standalone version of Babel. In [the webpack config](./webpack.config.js), we swap out the `@babel/core` references with `snack-babel-standalone/eslint`. The ESLint entrypoint is specifically made for this package, and should not be used inside the Runtime. [Learn more](../snack-babel-standalone/README.md)

### ESLint React plugin

This plugin tries to resolve the React version from local files. It does that using some Node tooling. Because this isn't available in the browser, we patched the version detection to always return `999.999.999` (the default version). This avoids including modules, like `fs` or `resolve`, in the ESLint bundle.

## Contributing

This package has a few commands, mainly to build, analyze and build for publishing.

- `yarn dev` → Builds an unoptimized development build.
- `yarn build` → Builds an optimized production build.
- `yarn analyze` → Builds an optimized production build, and opens the Webpack bundle analyzer.

> When adding new packages, or upgrading old ones, make sure no Node dependencies are added with `yarn analyze`. Also make sure only the minimum required code is being bundled, create patches if necessary.

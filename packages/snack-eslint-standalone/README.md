# @snack/eslint-standalone

Standalone version of ESLint used in the Snack Website. This version of ESLint is bundled with the `@babel/eslint-parser` and various rules. It's optimized to run inside the browser.

> Note, this package is decoupled from the yarn workspaces to prevent possible multiple babel versions being bundled.

## Installation

```sh
yarn add @snack/eslint-standalone
```

## Usage

```ts
import type { LintMessage } from '@snack/eslint-standalone';
import { linter, defaultConfig } from '@snack/eslint-standalone';

const code = `
  function App() {
    return (
      <View>
        <Text>Hello!</Text>
      </View>
    );
  }
`;

const result: LintMessage[] = linter.verify(code, defaultConfig);
```

## Caveats

Because both `eslint` and `@babel/eslint-parser` weren't built to run inside the browser, we have to do a few tricks to make this work.

### Babel parser

Babel is a huge library and runs mostly outside the browsers. To make the presets and plugins we need _actually work_, we need to bundle them with the babel parser. This is done by swapping out `@babel/core` with `@snack/babel-standalone/eslint`.

Because we need to run Babel inside the Snack Runtime, we already have a standalone version of Babel. In [the webpack config](./webpack.config.js), we swap out the `@babel/core` references with `@snack/babel-standalone/eslint`. The ESLint entrypoint is specifically made for this package, and should not be used inside the Runtime. [Learn more](../snack-babel-standalone/README.md)

### ESLint React plugin

This plugin tries to resolve the React version from local files. It does that using some Node tooling. Because this isn't available in the browser, we patched the version detection to always return `999.999.999` (the default version). This avoids including modules, like `fs` or `resolve`, in the ESLint bundle.

/**
 * These exports are required for the `@babel/eslint-parser` bundled in ESLint.
 * Without this, the parser would not know how to fetch the presets and plugins in babel.
 */
import { parseSync as babelParseSync } from '@babel/core';
import { default as transformPlugin } from '@babel/plugin-transform-typescript';

import { processOptions, registerPlugin } from './runtime';

// Note(cedric): we need this to fix async functions with 2 or more generics
registerPlugin('@babel/plugin-transform-typescript', transformPlugin);

// Re-export the functionality from the runtime, to keep presets and plugins in sync.
export * from './runtime';

// The tokTypes is an internal in babel, specifically for the `@babel/eslint-parser`.
// See: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/b08e4746a2f6321aa20410c00bc615662351f984/types/babel__core/index.d.ts#L724-L725
// @ts-expect-error Module '"@babel/core"' has no exported member 'tokTypes'.
export { types, tokTypes } from '@babel/core';

// Babel core's parse sync is used in the `@babel/eslint-parser`.
// See: https://github.com/babel/babel/blob/v7.14.2/eslint/babel-eslint-parser/src/index.js#L4
export function parseSync(input, options) {
  return babelParseSync(input, processOptions(options));
}

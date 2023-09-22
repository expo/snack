/**
 * Entry point for Babel used in `@babel/eslint-parser`.
 * This is mostly used in the Snack Website through ESLint.
 */

import {
  parseSync as babelParseSync,
  version as babelVersion,
} from '@babel/core';

import { processOptions } from '../registry';
import '../bundled';

// Set through the webpack config, using `import('@babel/core').version`.
export const version = babelVersion;

// The tokTypes is an internal in babel, specifically for the `@babel/eslint-parser`.
// See: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/b08e4746a2f6321aa20410c00bc615662351f984/types/babel__core/index.d.ts#L724-L725
// @ts-expect-error Module '"@babel/core"' has no exported member 'tokTypes'.
export { traverse, types, tokTypes } from '@babel/core';

// Babel core's parse sync is used in the `@babel/eslint-parser`.
// See: https://github.com/babel/babel/blob/v7.14.2/eslint/babel-eslint-parser/src/index.js#L4
export const parseSync: typeof babelParseSync = (input, options) => {
  return babelParseSync(input, processOptions(options));
}

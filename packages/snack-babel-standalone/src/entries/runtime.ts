/**
 * Entry point for `@babel/core`, `@babel/types`, and `@babel/traverse`.
 * This is mostly used in the Snack Runtime, and the Reanimated plugin.
 */

import { processOptions } from '../registry';
import '../bundled';

/** Snack babel standalone functions to interact with the bundled plugins and presets */
export * as snackBabel from '../registry';

// Drop-in replacement exports for Babel

import {
  // @ts-expect-error Module '"@babel/core"' has no exported member 'buildExternalHelpers'.
  buildExternalHelpers as babelHelpers, // Untyped internal, probably good to export. See: https://github.com/babel/babel/blob/f1ac2906b1066e47503e4d82d0602acd4be94e60/packages/babel-core/src/index.ts#L6
  transform as babelTransform,
  transformSync as babelTransformSync,
  TransformOptions,
  version as babelVersion,
} from '@babel/core';

export const version = babelVersion;

// Untyped internal, probably good to export. See: https://github.com/babel/babel/blob/f1ac2906b1066e47503e4d82d0602acd4be94e60/packages/babel-core/src/index.ts#L6
export const buildExternalHelpers = babelHelpers;

// Replacement for `require('@babel/core').transform`, used in Snack Runtime
export const transform = (code: string, options: TransformOptions) => {
  return babelTransform(code, processOptions(options));
}

// Replacement for `require('@babel/core').transformSync`, used in Reanimated plugin
export const transformSync: typeof babelTransformSync = (code, options) => {
  return babelTransformSync(code, processOptions(options))
};

// Replacement for `require('@babel/types')`, used in Reanimated plugin
export * as types from '@babel/types';

// Replacement for `require('@babel/core').traverse`, used in Reanimated plugin
export { traverse } from '@babel/core';

// Replacement for `require('@babel/generator')`, used in Reanimated plugin
export { default as generator } from '@babel/generator';

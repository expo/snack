export { version, transform, transformSync } from '@babel/core';
export { default as generate } from '@babel/generator';
export { default as traverse } from '@babel/traverse';
export * as types from '@babel/types';

export * as snackBabel from './_registry';

/**
 * Originally from `@babel/core`, but untyped internal.
 * @see https://github.com/babel/babel/blob/f1ac2906b1066e47503e4d82d0602acd4be94e60/packages/babel-core/src/index.ts#L6
 */
export type buildExternalHelpers = any;

export * from '../src/runtime';

export { types, parseSync } from '@babel/core';

/**
 * Originally from `@babel/core`, but untyped internal.
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/b08e4746a2f6321aa20410c00bc615662351f984/types/babel__core/index.d.ts#L724-L725
 */
export type tokTypes = any;

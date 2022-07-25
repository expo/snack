import { Linter } from 'eslint/lib/linter/linter';
import * as babelParser from '@babel/eslint-parser';

/** The default ESLint config with the bundled parser and plugins. */
export { defaultConfig } from './config';

/** The ESLint linter instance containing the bundled parser and plugins. */
export const linter = new Linter();

// Register the parser to bundle it
linter.defineParser('@babel/eslint-parser', babelParser);

// Register the plugins to bundle it
// TODO

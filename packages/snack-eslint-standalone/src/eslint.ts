import { Linter, Rule } from 'eslint/lib/linter/linter';
import * as babelParser from '@babel/eslint-parser';

import { rules as reactRules } from 'eslint-plugin-react';
import { rules as reactHooksRules } from 'eslint-plugin-react-hooks';

/** The default ESLint config with the bundled parser and plugins. */
export { defaultConfig } from './config';

/** The ESLint linter instance containing the bundled parser and plugins. */
export const linter = new Linter();

// Register the parser to bundle it
linter.defineParser('@babel/eslint-parser', babelParser);

// Register the plugins to bundle it
linter.defineRules(prefixRules('react', reactRules));
linter.defineRules(prefixRules('react-hooks', reactHooksRules));

/**
 * A helper to prefix all rules by the package name.
 * This matches ESLint internal rules loaders, since we don't import them.
 * It transforms rules like `rules-of-hooks` to `${prefix}/rules-of-hooks`
 */
function prefixRules(prefix: string, rules: any) {
  return Object.fromEntries<any>(
    Object.entries(rules).map(([key, value]) => ([`${prefix}/${key}`, value]))
  );
}

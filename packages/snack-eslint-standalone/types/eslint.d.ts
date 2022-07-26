import { Linter } from 'eslint/lib/linter/linter';

export const linter: InstanceType<typeof Linter>;
export const defaultConfig: any;

/**
 * Return type of `linter.verify`, but without eslint as dependency
 * Keep in sync with `import('eslint').LintMessage`.
 */
export type LintMessage = {
  /** If `true` then this is a fatal error. */
  fatal?: boolean;
  /** The ID of the rule which makes this message. */
  ruleId: string;
  /** The severity of this message. */
  severity: 0 | 1 | 2;
  /** The error message. */
  message: string;
  /** The 1-based line number. */
  line?: number;
  /** The 1-based column number. */
  column?: number;
  /** The 1-based line number of the end location. */
  endLine?: number;
  /** The 1-based column number of the end location. */
  endColumn?: number;

  // `suggestions` and `fix` are skipped, we only import the linter, not the fixer
};

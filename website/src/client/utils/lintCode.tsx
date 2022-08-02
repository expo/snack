import type { LintMessage } from 'snack-eslint-standalone';
import { linter, getLinterConfig } from 'snack-eslint-standalone';

import { Annotation } from '../types';
import { isTS } from './fileUtilities';

export default function lintCode(
  fileName: string,
  code: string,
  userConfig?: object
): Annotation[] {
  const config = getLinterConfig(fileName, userConfig);
  const errors: LintMessage[] = linter.verify(code, config, { filename: fileName });

  return errors
    .map((err) => {
      const isParsingError = err.message.toLowerCase().startsWith('parsing error');
      if (
        isParsingError &&
        isTS(fileName) &&
        err.message.match(/ (as|extends|typeof|private|public) /)
      ) {
        // babel-eslint does not recognize the full TypeScript syntax.
        // Ingore any parsing errors due to the use of the "as" keyword
        return null;
      }
      return {
        location: {
          fileName,
          startLineNumber: err.line,
          endLineNumber: err.endLine,
          startColumn: err.column,
          endColumn: err.endColumn,
        },
        message: `${err.message} (${err.ruleId})`,
        severity: isParsingError ? 4 : Math.max(err.severity, 2),
        source: 'ESLint',
      };
    })
    .filter((err) => err) as Annotation[];
}

import parse from 'json-to-ast';

import { Annotation } from '../types';

export default function lintJson(fileName: string, code: string): Annotation[] {
  try {
    parse(code, { source: fileName });
    return [];
  } catch (e) {
    return [
      {
        location: {
          fileName,
          startLineNumber: e.line || 0,
          endLineNumber: e.line || 0,
          startColumn: e.column || 0,
          endColumn: e.column || 0,
        },
        message: e.message,
        severity: 4,
        source: 'JSON',
      },
    ];
  }
}

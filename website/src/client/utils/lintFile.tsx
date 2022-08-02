import { SnackFiles, Annotation } from '../types';
import { isESLintConfig, isScript, isJson } from './fileUtilities';

async function lintCode(path: string, code: string, files: SnackFiles): Promise<Annotation[]> {
  const eslintrc = Object.keys(files).find(isESLintConfig);
  let config: object | undefined;
  if (eslintrc) {
    try {
      // Use the custom config provided by the user, must be JSON
      // @ts-ignore
      config = JSON.parse(files[eslintrc].contents);
    } catch (e) {
      return [
        {
          message: `Content of the ESLint config (${eslintrc}) is not valid JSON`,
          location: {
            fileName: eslintrc,
            startLineNumber: 0,
            endLineNumber: 0,
            startColumn: 0,
            endColumn: 0,
          },
          severity: 4,
          source: 'ESLint',
        },
      ];
    }
  }

  const { default: lintCode } = await import('./lintCode');
  return lintCode(path, code, config);
}

export default async function lintFile(
  selectedFile: string,
  files: SnackFiles
): Promise<Annotation[]> {
  const file = files[selectedFile];

  if (!file || file.type !== 'CODE') {
    return [];
  } else if (isScript(selectedFile) && file.contents) {
    return lintCode(selectedFile, file.contents, files);
  } else if (isJson(selectedFile)) {
    const { default: lintJson } = await import('./lintJson');
    return lintJson(selectedFile, file.contents);
  } else {
    return [];
  }
}

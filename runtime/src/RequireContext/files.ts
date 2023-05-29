import path from 'path';

import * as Files from '../Files';

/**
 * Convert a SystemJS module path to proper `require.context` target.
 * This normalizes the following strings to the usable strings:
 *   - `module://App.js` -> `./`
 *   - `module://components/Test.tsx.js` -> `./components`
 */
export function getTargetFromSystemModule(moduleFileRaw: string, directory: string) {
  // SystemJS has two known issues with path translation:
  // 1. The Snack SystemJS resolver adds one or more `.js` extensions, to force-execute the code as JS
  // 2. SystemJS itself uses the `module://` prefix to all files, we should remove it when comparing
  const moduleFile = moduleFileRaw
    // .replace(/(\.[a-z]+)(.js)*$/i, '$1') // remove all extraneous `.js` extensions
    .replace(/^(module:\/\/|\.\/?)/, ''); // drop the `modulle://` or `./` prefix

  const parentDir = path.dirname(moduleFile);

  return './' + path.normalize(path.join(parentDir, directory));
}

/**
 * Get all matching files for the `require.context` request.
 * This normalizes the `parentFileRaw` (where `require.context` was called), and tries to match all known files.
 * The paths are returned as relative paths to the executing file.
 */
export function getMatchingFiles(contextTarget: string, matcher: RegExp) {
  const contextFiles = Object.keys(Files.files)
    .map((absoluteFilePath) => `./${absoluteFilePath}`)
    .filter((filePath) => filePath.startsWith(contextTarget))
    .filter((filePath) => matcher.test(filePath));

  return contextFiles;
}

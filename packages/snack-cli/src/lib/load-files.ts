import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Snack, SnackFile } from 'snack-sdk';
import { glob } from 'glob';

import { isAsset } from './path-is';

// Inspired by Snack website blacklist
// https://github.com/expo/snack/blob/317f3fbb1d6b6074884623c84f7c24a3fbfee013/website/src/client/utils/convertDataTransferItemsToFiles.tsx#L26
export const IGNORE_DIRS = ['node_modules', '.git', '.snack', 'build', 'dist'];

export async function loadFiles(dir: string) {
  const files: { [path: string]: SnackFile } = {};

  const filePaths = await glob('**/*', {
    cwd: dir,
    ignore: IGNORE_DIRS.map(d => `${d}/**`),
    nodir: true,
  });

  for (const filePath of filePaths) {
    const fullPath = path.join(dir, filePath);
    let file: SnackFile | null = null;
    try {
      if (isAsset(filePath)) {
        file = {
          type: 'ASSET',
          contents: new File([await fs.readFile(fullPath)], filePath),
        };
      } else {
        file = {
          type: 'CODE',
          contents: await fs.readFile(fullPath, { encoding: 'utf-8' }),
        };
      }
    } catch (error) {
      console.error(`Failed to read file ${fullPath}`, error);
      continue;
    }
    
    if (file) {
      files[filePath] = file;
    }
  }

  return files;
};

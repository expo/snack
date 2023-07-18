// Maintains the state of the user's 'local' Snack files (including assets), updating them with
// diffs etc. Does NOT deal with evaluating code, that happens in `Modules`.

import { applyPatch } from 'diff';
import Constants from 'expo-constants';
import { AppManifest } from 'expo-constants/build/Constants.types';
import { SnackFiles } from 'snack-content';

type Message = {
  type: 'CODE';
  diff: { [key: string]: string };
  s3url: { [key: string]: string };
  metadata?: {
    webHostname?: string;
  };
};

export type FileInfo = {
  isAsset: boolean;
  isBundled?: boolean;
  s3Url: string | undefined;
  s3Contents: string | undefined;
  diff: string | undefined;
  contents: string | undefined;
};

/** Order of file names to resolve as entry file */
const ENTRY_FILES = [
  'index.js',
  'index.ts',
  'index.tsx',
  'App.js',
  'App.ts',
  'App.tsx',
  'app.js',
  'app.ts',
  'app.tsx',
];

/** Exposed for testing */
export class FileManager {
  constructor(
    /** All known files within the Snack, including code and asset files */
    readonly files: Map<string, FileInfo> = new Map()
  ) {}

  /**
   * Retrieve file information for a given file path.
   * This path should be absolute, without a leading slash.
   */
  get(filePath: string) {
    const fileInfo = this.files.get(filePath);

    if (!fileInfo) {
      return undefined;
    }

    return fileInfo.isAsset
      ? { isAsset: true, isBundled: !!fileInfo.isBundled, s3Url: fileInfo.s3Url }
      : { isAsset: false, isBundled: !!fileInfo.isBundled, contents: fileInfo.contents };
  }

  /**
   * Retrieve all file paths loaded within the Snack.
   * These paths are absolute, without a leading slash.
   */
  list() {
    return [...this.files.keys()];
  }

  /**
   * Resolve the entry file for the Snack, based on loaded files.
   * When none of the known entry files are found, `App.js` is returned.
   * @todo cache this value, and invalidate once the files are changed
   */
  entry() {
    for (const filePath of ENTRY_FILES) {
      if (this.files.has(filePath)) {
        return filePath;
      }
    }

    return 'App.js';
  }
}

/**
 * Load all files embedded in the app manifest into the file manager.
 * This should be executed once when the app is loaded.
 * Exposed for testing.
 */
export function handleManifestCode(manager: FileManager, manifest: AppManifest | null) {
  const code: SnackFiles | undefined = manifest?.extra?.code;

  if (!code) {
    return;
  }

  for (const filePath in code) {
    const manifestFile = code[filePath];
    const isAsset = manifestFile.type === 'ASSET';

    manager.files.set(filePath, {
      isAsset,
      isBundled: false,
      diff: undefined,
      contents: !isAsset ? String(manifestFile.contents) : undefined,
      s3Url: isAsset ? String(manifestFile.contents) : undefined,
      s3Contents: undefined,
    });
  }
}

/**
 * Update the file manager with all changes received within the update message.
 * This returns an array of all file paths changed because of the update.
 */
export async function handleFileUpdate(manager: FileManager, message: Message) {
  if (message.type !== 'CODE') {
    throw new Error("`Files.update(...)` only accepts 'CODE' `message`s");
  }

  const { diff: newDiffs, s3url: newS3Urls } = message;
  const changedPaths = [];

  await Promise.all(
    Object.keys(newDiffs).map(async (path) => {
      const newDiff = newDiffs[path];
      const oldFile = manager.files.get(path);

      if (newS3Urls[path]) {
        // Has content in S3?
        const newS3Url = newS3Urls[path];
        if (newS3Url.includes('~asset') || newS3Url.includes('%7Easset')) {
          // Asset? Only save the S3 URL.
          if (oldFile?.s3Url !== newS3Url) {
            manager.files.set(path, {
              ...(oldFile ?? {}),
              isAsset: true,
              isBundled: false,
              s3Url: newS3Url,
              s3Contents: undefined,
              diff: undefined,
              contents: undefined,
            });
            changedPaths.push(path);
          }
        } else {
          // Ensure cached S3 contents and diff are up to date, compute contents if any changes
          //
          // TODO(nikki): This case needs to be tested
          if (oldFile?.s3Url !== newS3Url || oldFile?.diff !== newDiffs[path]) {
            const newS3Contents =
              oldFile?.s3Url === newS3Url
                ? (oldFile.s3Contents as string)
                : await (
                    await fetch(newS3Url, {
                      headers: {
                        'Content-Type': 'text/plain',
                      },
                    })
                  ).text();

            manager.files.set(path, {
              ...(oldFile ?? {}),
              isAsset: false,
              isBundled:
                path === 'reason.js' &&
                message.metadata &&
                message.metadata.webHostname === 'reason-snack.surge.sh',
              s3Url: newS3Url,
              s3Contents: newS3Contents,
              diff: newDiff,
              contents: applyPatch(newS3Contents, newDiff),
            });

            changedPaths.push(path);
          }
        }
      } else {
        // No content on S3 -- ensure cached diff is up to date, compute contents if any changes
        if (oldFile?.diff !== newDiffs[path]) {
          manager.files.set(path, {
            ...(oldFile ?? {}),
            isAsset: false,
            isBundled: false,
            s3Url: undefined,
            s3Contents: undefined,
            diff: newDiff,
            // Remove the first newline from `applyPatch`, since this is an non-existing newline
            contents: applyPatch('', newDiff).replace('\n', ''),
          });

          changedPaths.push(path);
        }
      }
    })
  );

  for (const path in files) {
    // Delete removed files
    if (!newDiffs.hasOwnProperty(path)) {
      manager.files.delete(path);
      changedPaths.push(path);
    }
  }

  return changedPaths;
}

/** Create a single file manager instance used within the runtime */
export const files = new FileManager();

// Initialize by reading from `extra.code` in manifest if present
handleManifestCode(files, Constants.manifest);

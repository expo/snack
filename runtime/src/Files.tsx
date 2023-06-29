// Maintains the state of the user's 'local' Snack files (including assets), updating them with
// diffs etc. Does NOT deal with evaluating code, that happens in `Modules`.

import { applyPatch } from 'diff';
import Constants from 'expo-constants';

type Message = {
  type: 'CODE';
  diff: { [key: string]: string };
  s3url: { [key: string]: string };
  metadata?: {
    webHostname?: string;
  };
};

type File = {
  isAsset: boolean;
  isBundled?: boolean;
  s3Url: string | undefined;
  s3Contents: string | undefined;
  diff: string | undefined;
  contents: string | undefined;
};

const files: { [key: string]: File } = {};

// Initialize by reading from `extra.code` in manifest if present
const manifest = Constants.manifest;

if (manifest?.extra?.code) {
  const initialCode = manifest.extra.code;
  Object.keys(initialCode).forEach((path) => {
    const initialFile = initialCode[path];
    const isAsset = initialFile.type === 'ASSET';
    files[path] = {
      isAsset,
      s3Url: isAsset ? initialFile.contents : undefined,
      s3Contents: undefined,
      diff: undefined,
      contents: !isAsset ? initialFile.contents : undefined,
    };
  });
}

// Update files -- currently only handles updates from remote `message`s. Returns an array
// containing paths of changed files.
export const update = async ({ message }: { message: Message }) => {
  if (message && message.type === 'CODE') {
    const { diff: newDiffs, s3url: newS3Urls } = message;
    const changedPaths = [];
    await Promise.all(
      Object.keys(newDiffs).map(async (path) => {
        const newDiff = newDiffs[path];
        if (newS3Urls[path]) {
          // Has content in S3?
          const newS3Url = newS3Urls[path];
          if (newS3Url.includes('~asset') || newS3Url.includes('%7Easset')) {
            // Asset? Only save the S3 URL.
            if (!files[path] || files[path].s3Url !== newS3Url) {
              files[path] = {
                ...files[path],
                isAsset: true,
                isBundled: false,
                s3Url: newS3Url,
                s3Contents: undefined,
                diff: undefined,
                contents: undefined,
              };
              changedPaths.push(path);
            }
          } else {
            // Ensure cached S3 contents and diff are up to date, compute contents if any changes
            //
            // TODO(nikki): This case needs to be tested
            if (
              !files[path] ||
              files[path].s3Url !== newS3Url ||
              files[path].diff !== newDiffs[path]
            ) {
              const newS3Contents =
                files[path] && files[path].s3Url === newS3Url
                  ? (files[path].s3Contents as string)
                  : await (
                      await fetch(newS3Url, {
                        headers: {
                          'Content-Type': 'text/plain',
                        },
                      })
                    ).text();
              files[path] = {
                ...files[path],
                isAsset: false,
                isBundled:
                  path === 'reason.js' &&
                  message.metadata &&
                  message.metadata.webHostname === 'reason-snack.surge.sh',
                s3Url: newS3Url,
                s3Contents: newS3Contents,
                diff: newDiff,
                contents: applyPatch(newS3Contents, newDiff),
              };
              changedPaths.push(path);
            }
          }
        } else {
          // No content on S3 -- ensure cached diff is up to date, compute contents if any changes
          if (!files[path] || files[path].diff !== newDiffs[path]) {
            files[path] = {
              ...files[path],
              isAsset: false,
              isBundled: false,
              s3Url: undefined,
              s3Contents: undefined,
              diff: newDiff,
              contents: applyPatch('', newDiff),
            };
            changedPaths.push(path);
          }
        }
      })
    );

    for (const path in files) {
      // Delete removed files
      if (!newDiffs.hasOwnProperty(path)) {
        delete files[path];
        changedPaths.push(path);
      }
    }

    return changedPaths;
  }

  throw new Error("`Files.update(...)` only accepts 'CODE' `message`s");
};

// Return the entrypoint path
export const entry = () => {
  const names = ['index.js', 'App.tsx', 'App.ts', 'App.js', 'app.js'];

  for (const name of names) {
    if (files[name]) {
      return name;
    }
  }

  return 'App.js';
};

// Return information about a file in the form `{ isAsset: true, s3Url }` or
// `{ isAsset: false, contents }`. Returns `undefined` if no such file.
export const get = (path: string) => {
  if (!files[path]) {
    return undefined;
  }

  const { isAsset, isBundled, s3Url, contents } = files[path];

  if (isAsset) {
    return { isAsset, isBundled, s3Url };
  } else {
    return { isAsset, isBundled, contents };
  }
};

export const list = () => Object.keys(files);

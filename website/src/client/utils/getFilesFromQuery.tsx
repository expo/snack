import { isEntryPoint } from './fileUtilities';
import { QueryInitParams, SnackFiles } from '../types';

export default function getFilesFromQuery(query: QueryInitParams, defaultFiles: SnackFiles): any {
  let files;
  try {
    if (query?.sourceUrl) {
      files = {
        'App.js': {
          type: 'CODE',
          url: query.sourceUrl,
        },
      };
    } else if (query?.files) {
      files = JSON.parse(query.files);
    } else if (query?.code) {
      files = {
        'App.js': {
          type: 'CODE',
          contents: query.code,
        },
      };
    } else {
      files = defaultFiles;
    }

    if (typeof files !== 'object') {
      throw new Error('not an object');
    }
    if (!Object.keys(files).find(isEntryPoint)) {
      throw new Error('no entry point found');
    }
    for (const path in files) {
      const file = files[path];
      if (typeof file !== 'object' || (file.type !== 'CODE' && file.type !== 'ASSET')) {
        throw new Error(`'${path}' is not a valid file object`);
      }
      // @ts-ignore
      if (!file.contents && !file.url) {
        throw new Error(`'${path}' should contain either contents or a url`);
      }
    }

    return files;
  } catch (e) {
    throw new Error(`Invalid files ${e.message}`);
  }
}

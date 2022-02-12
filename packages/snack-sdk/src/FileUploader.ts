import { SnackFile } from 'snack-projects';

import { Logger } from './Logger';
import { SnackError } from './types';
import { fetch, createError } from './utils';

export type FileUploaderRequest = {
  path: string;
  file: SnackFile;
};

export type FileUploaderCallback = (
  request: FileUploaderRequest,
  resultURL?: string,
  error?: SnackError
) => any;

export default class FileUploader {
  private apiURL: string;
  private logger?: Logger;
  private status: {
    [path: string]: {
      file: SnackFile;
      promise: Promise<any>;
    };
  } = {};
  private callback: FileUploaderCallback;

  constructor(options: { apiURL: string; callback: FileUploaderCallback; logger?: Logger }) {
    this.apiURL = options.apiURL;
    this.callback = options.callback;
    this.logger = options.logger;
  }

  add(path: string, file: SnackFile) {
    const status = this.status[path];
    if (status && status.file === file) {
      return status.promise;
    }
    this.status[path] = {
      file,
      promise: this.upload(path, file),
    };
    return this.status[path].promise;
  }

  remove(path: string, file?: SnackFile) {
    if (!file || this.status[path]?.file === file) {
      delete this.status[path];
    }
  }

  async waitForCompletion() {
    let promises = Object.values(this.status).map((status) => status.promise);
    while (promises.length) {
      await Promise.all(promises);
      promises = Object.values(this.status).map((status) => status.promise);
    }
  }

  private async upload(path: string, file: SnackFile): Promise<any> {
    try {
      this.logger?.module('Uploading file', path, '...');
      let url: string;
      let input;
      switch (file.type) {
        case 'CODE':
          url = `${this.apiURL}/--/api/v2/snack/uploadCode`;
          input = {
            method: 'POST',
            body: JSON.stringify({ code: file.contents }),
            headers: { 'Content-Type': 'application/json' },
          };
          break;
        case 'ASSET':
          url = `${this.apiURL}/--/api/v2/snack/uploadAsset`;
          if (
            (typeof FormData !== 'undefined' && file.contents instanceof FormData) ||
            (typeof file.contents === 'object' && file.contents.constructor?.name === 'FormData')
          ) {
            input = {
              method: 'POST',
              body: file.contents,
            };
          } else if (typeof FormData !== 'undefined') {
            const formData = new FormData();
            // @ts-expect-error: file.contents can be both File or Blob
            formData.append('asset', file.contents, file.contents?.name || path);
            input = {
              method: 'POST',
              body: formData,
            };
          } else {
            // TODO: Add support for uploading files using ArrayBuffer in body to the /snack/uploadAsset end-point
            // That way it's no longer neccessary to polyfill FormData is environments such as node.
            throw new Error(
              'Uploading assets is not supported in this environment. Make sure FormData is polyfilled or provide the data as a FormData object'
            );
          }
          break;
        default:
          // @ts-ignore: Property 'type' does not exist on type 'never'
          throw new Error(`Invalid file type ${file.type}`);
      }

      const response = await fetch(url, input);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      const result = await response.json();
      const resultURL = result.url;

      if (this.status[path]?.file === file) {
        this.logger?.module('Uploaded file', path, resultURL);
        delete this.status[path];
        try {
          this.callback({ path, file }, resultURL);
        } catch (e) {
          return Promise.reject(e);
        }
      }
    } catch (e) {
      const error = createError({
        message: `Failed to upload file ${path} (${e.message})`,
        fileName: path,
      });
      this.logger?.error(error);
      if (this.status[path]?.file === file) {
        delete this.status[path];
        this.callback({ path, file }, undefined, error);
      }
    }
  }
}

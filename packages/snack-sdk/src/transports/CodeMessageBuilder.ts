import { createPatch } from 'diff';
import {
  SnackFiles,
  SDKVersion,
  SnackCodeFile,
  SnackDependencies,
  isModulePreloaded,
} from 'snack-content';
import { UAParser } from 'ua-parser-js';

import { ProtocolCodeMessage, ProtocolCodeMessageDependencies } from './Protocol';
import FileUploader, { FileUploaderCallback } from '../FileUploader';
import { Logger } from '../Logger';
import { SnackIdentityState } from '../defaultConfig';

export type SnackCode = {
  files: SnackFiles;
  dependencies: SnackDependencies;
  sdkVersion: SDKVersion;
};

const SnackIdentityCode: SnackCode = {
  files: SnackIdentityState.files,
  dependencies: SnackIdentityState.dependencies,
  sdkVersion: SnackIdentityState.sdkVersion,
};

export type CodeMessageBuilderCallback = (codeMessage: ProtocolCodeMessage, code: SnackCode) => any;

export function getFileDiff(oldCode: string, newCode: string): string {
  const patch = createPatch('code', oldCode, newCode, '', '', {
    context: 0,
  });
  if (patch) {
    return patch;
  } else {
    throw new Error('Error creating a file diff');
  }
}

const PLACEHOLDER_URL =
  'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export default class CodeMessageBuilder {
  private callback: CodeMessageBuilderCallback;
  private code: SnackCode = SnackIdentityCode;
  private codeMessage?: ProtocolCodeMessage;
  private logger?: Logger;
  private codeUploader?: FileUploader;
  private maxDiffPlaceholder?: string;
  private placeholderURLs: { [path: string]: string } = {};
  private uploadedURLs: { [path: string]: string } = {};
  private verifyCodeMessageSize: (message: ProtocolCodeMessage) => boolean;

  constructor(options: {
    callback: CodeMessageBuilderCallback;
    verifyCodeMessageSize: (message: ProtocolCodeMessage) => boolean;
    apiURL?: string;
    logger?: Logger;
    maxDiffPlaceholder?: string;
  }) {
    this.logger = options.logger;
    this.callback = options.callback;
    this.verifyCodeMessageSize = options.verifyCodeMessageSize;
    this.maxDiffPlaceholder = options.maxDiffPlaceholder;
    this.codeUploader = options.apiURL
      ? new FileUploader({
          apiURL: options.apiURL,
          logger: options.logger,
          callback: this.onFileUploaded,
        })
      : undefined;
  }

  setCode(code: SnackCode) {
    if (code === this.code) {
      return;
    }

    const prevCode = this.code;
    const { files } = code;
    this.code = code;

    // Cancel any uploads for files that were removed or changed
    for (const path in prevCode.files) {
      if (prevCode.files[path].contents !== files[path]?.contents) {
        delete this.placeholderURLs[path];
        delete this.uploadedURLs[path];
        this.codeUploader?.remove(path, prevCode.files[path]);
      }
    }

    // Generate code message
    const codeMessage = this.createCodeMessage(code, this.codeMessage, prevCode);
    this.codeMessage = codeMessage;

    // When the code message size is valid and there are no pending
    // uploads, then fire the callback immediately
    if (this.verifyCodeMessageSize(codeMessage)) {
      if (!Object.keys(this.placeholderURLs).length) {
        this.callback(codeMessage, code);
      }
      return;
    }

    // Upload files if the code message exceeds the limit
    // Sort code files by size
    if (this.codeUploader) {
      const paths = Object.keys(files)
        .filter((path) => files[path].type === 'CODE')
        // @ts-ignore
        .sort((a, b) => files[b].contents.length - files[a].contents.length);

      // Upload the largest file
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        if (!this.uploadedURLs[path] && !this.placeholderURLs[path]) {
          const file: SnackCodeFile = files[path] as any;
          this.placeholderURLs[path] = PLACEHOLDER_URL;
          // this.logger?.comm('Uploading file', path, `, ${file.contents.length} bytes ...`);
          this.codeUploader.add(path, file);
          codeMessage.diff[path] = '';
          codeMessage.s3url[path] = this.placeholderURLs[path];
          if (this.verifyCodeMessageSize(codeMessage)) {
            // Message size is now valid. When the upload completes, it
            // will try to call the callback
            return;
          }
        }
      }
    }

    // Message is still too large
    this.logger?.error('Message size is too large');
  }

  private createCodeMessage(
    code: SnackCode,
    prevCodeMessage?: ProtocolCodeMessage,
    prevCode?: SnackCode,
  ): ProtocolCodeMessage {
    const { files, dependencies, sdkVersion } = code;

    const diff: any = { ...files };
    const s3url: any = {};
    for (const path in files) {
      const file = files[path];
      if (this.uploadedURLs[path] || this.placeholderURLs[path]) {
        diff[path] = '';
        s3url[path] = this.uploadedURLs[path] || this.placeholderURLs[path];
      } else {
        if (file.type === 'CODE') {
          if (
            prevCodeMessage?.diff[path] &&
            prevCode?.files[path].contents === code.files[path].contents
          ) {
            diff[path] = prevCodeMessage.diff[path];
          } else {
            if (this.maxDiffPlaceholder && file.contents.length >= this.maxDiffPlaceholder.length) {
              diff[path] = this.maxDiffPlaceholder;
            } else {
              diff[path] = getFileDiff('', file.contents);
            }
          }
        } else {
          diff[path] = '';
        }
        if (file.type === 'ASSET' && typeof file.contents === 'string') {
          s3url[path] = file.contents;
        }
      }
    }

    const deps: ProtocolCodeMessageDependencies = {};
    for (const name in dependencies) {
      const dep = dependencies[name];
      if (dep.handle && !isModulePreloaded(name, sdkVersion)) {
        deps[name] = {
          version: dep.version,
          handle: dep.handle,
          // Resolved has been replaced by handle. It is still needed for pre SDK 37 runtimes
          resolved: dep.handle.substring(dep.handle.lastIndexOf('@') + 1),
        };
      }
    }

    const metadata: any = {
      expoSDKVersion: code.sdkVersion,
      // TODO: restore sdk version field
      // webSnackSDKVersion: require('../../package.json').version,
    };
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      const ua = new UAParser(navigator.userAgent).getResult();
      metadata.webHostName = typeof window !== 'undefined' ? window.location.hostname : undefined;
      metadata.webOSArchitecture = ua.cpu.architecture;
      metadata.webOSFamily = ua.os.name;
      metadata.webOSVersion = ua.os.version;
      metadata.webLayoutEngine = ua.engine.name;
      metadata.webDeviceType = ua.device.type;
      metadata.webBrowser = ua.browser.name;
      metadata.webBrowserVersion = ua.browser.version;
    }

    return {
      type: 'CODE',
      diff,
      s3url,
      dependencies: deps,
      metadata,
    };
  }

  private onFileUploaded: FileUploaderCallback = (request, resultURL, _error) => {
    const { path } = request;
    delete this.placeholderURLs[path];
    if (resultURL) {
      this.uploadedURLs[path] = resultURL;
      if (!Object.keys(this.placeholderURLs).length) {
        const codeMessage = this.createCodeMessage(this.code, this.codeMessage, this.code);
        if (this.verifyCodeMessageSize(codeMessage)) {
          this.callback(codeMessage, this.code);
        }
      }
    }
  };
}

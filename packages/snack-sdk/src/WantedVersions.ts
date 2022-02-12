import { SDKVersion, SnackDependencyVersions, sdks } from 'snack-projects';

import { Logger } from './Logger';
import { SnackError } from './types';
import { fetch } from './utils';

export type WantedDependencyVersionsCallback = (
  sdkVersion: SDKVersion,
  result?: SnackDependencyVersions,
  error?: SnackError
) => any;

export class WantedDependencyVersions {
  private readonly callback: WantedDependencyVersionsCallback;
  private readonly logger?: Logger;
  private sdkVersion?: SDKVersion;
  private promise: Promise<any>;

  constructor(options: { logger?: Logger; callback: WantedDependencyVersionsCallback }) {
    this.logger = options.logger;
    this.callback = options.callback;
    this.promise = Promise.resolve();
  }

  setSDKVersion(sdkVersion: SDKVersion) {
    if (this.sdkVersion !== sdkVersion) {
      this.sdkVersion = sdkVersion;
      this.promise = this._fetch(sdkVersion);
    }
  }

  waitForCompletion() {
    return this.promise;
  }

  private async _fetch(sdkVersion: SDKVersion): Promise<any> {
    let json: any;
    try {
      this.logger?.module('fetching bundledNativeModules for SDK', sdkVersion, '...');
      const url = `https://cdn.jsdelivr.net/npm/expo@${encodeURIComponent(
        sdks[sdkVersion]?.version || sdkVersion
      )}/bundledNativeModules.json`;
      const response = await fetch(url);
      json = await response.json();
    } catch (e) {
      if (this.sdkVersion === sdkVersion) {
        this.logger?.error(e);
        this.callback(sdkVersion, undefined, e);
      }
      return;
    }
    if (this.sdkVersion === sdkVersion) {
      this.logger?.module('fetched bundledNativeModules for SDK', sdkVersion, json);
      this.callback(sdkVersion, json);
    }
  }
}

import { SDKVersion, SnackDependencyVersions, sdks } from 'snack-content';

import { Logger } from './Logger';
import { SnackError } from './types';
import { fetch } from './utils';

export type WantedDependencyVersionsCallback = (
  sdkVersion: SDKVersion,
  result?: SnackDependencyVersions,
  error?: SnackError
) => any;

interface WantedDependencyVersionsOptions {
  /** The Expo API URL to fetch the remote versioned modules from */
  apiUrl: string;
  logger?: Logger;
  callback: WantedDependencyVersionsCallback;
}

export class WantedDependencyVersions {
  private readonly callback: WantedDependencyVersionsCallback;
  private readonly logger?: Logger;
  private sdkVersion?: SDKVersion;
  private promise: Promise<any>;
  private apiUrl: string;

  constructor(options: WantedDependencyVersionsOptions) {
    this.apiUrl = options.apiUrl;
    this.logger = options.logger;
    this.callback = options.callback;
    this.promise = Promise.resolve();
  }

  setSDKVersion(sdkVersion: SDKVersion) {
    if (this.sdkVersion !== sdkVersion) {
      this.sdkVersion = sdkVersion;
      this.promise = this.fetchModules(sdkVersion);
    }
  }

  waitForCompletion() {
    return this.promise;
  }

  /**
   * Fetch all versioned modules from an SDK.
   * This is similar to the `getCombinedKnownVersionsAsync` method.
   * @see https://github.com/expo/expo/blob/0f1b5f0cd1caa86db3c01a001b14def93062a07e/packages/%40expo/cli/src/start/doctor/dependencies/getVersionedPackages.ts#L34
   */
  private async fetchModules(sdkVersion: SDKVersion): Promise<void> {
    if (this.sdkVersion !== sdkVersion) {
      return;
    }

    try {
      this.logger?.module('fetching versioned modules for SDK', sdkVersion, '...');

      // TODO(cedric): check why this is still necessary
      const sdkVersionString = sdks[sdkVersion]?.version || sdkVersion;
      const [remoteVersions, bundledVersions] = await Promise.all([
        this.fetchRemoteVersionedModules(sdkVersionString),
        this.fetchBundledNativeModules(sdkVersionString),
      ]);

      const versions = {
        ...remoteVersions,
        ...bundledVersions,
      };

      // Note(cedric): SDK could have changed during fetching
      if (this.sdkVersion === sdkVersion) {
        this.logger?.module('fetched versioned modules for SDK', sdkVersion, versions);
        this.callback(sdkVersion, versions);
      }
    } catch (error) {
      // Note(cedric): SDK could have changed during fetching
      if (this.sdkVersion === sdkVersion) {
        this.logger?.error(error);
        this.callback(sdkVersion, undefined, error);
      }
    }
  }

  /**
   * Fetch all bundled native modules from the `expo/bundledNativeModules.json` file.
   */
  private fetchBundledNativeModules(sdkVersion: string): Promise<Record<string, string>> {
    const urlVersion = encodeURIComponent(sdkVersion);
    return fetch(`https://cdn.jsdelivr.net/npm/expo@${urlVersion}/bundledNativeModules.json`)
      .then((response) => response.json())
      .then((data) => data || {});
  }

  /**
   * Fetch all remote versioned modules from the `/versions/latest` API endpoint.
   */
  private fetchRemoteVersionedModules(sdkVersion: string): Promise<Record<string, string>> {
    return fetch(`${this.apiUrl}/--/api/v2/versions/latest`)
      .then((response) => response.json())
      .then((data) => this.normalizeRemoteVersionResponse(sdkVersion, data));
  }

  /**
   * Normalize the versions response, and account for incorrect settings.
   * @see https://github.com/expo/expo/blob/0f1b5f0cd1caa86db3c01a001b14def93062a07e/packages/%40expo/cli/src/start/doctor/dependencies/getVersionedPackages.ts#L13-L31
   */
  private normalizeRemoteVersionResponse(sdkVersion: string, response: any = {}) {
    const sdkVersionSettings = response?.data?.sdkVersions?.[sdkVersion];

    if (!sdkVersionSettings) {
      return {};
    }

    const { relatedPackages, facebookReactVersion, facebookReactNativeVersion } =
      sdkVersionSettings;

    const reactVersion = facebookReactVersion
      ? {
          react: facebookReactVersion,
          'react-dom': facebookReactVersion,
        }
      : undefined;

    // Adds `react-dom`, `react`, and `react-native` to the list of known package versions (`relatedPackages`)
    return {
      ...relatedPackages,
      ...reactVersion,
      'react-native': facebookReactNativeVersion,
    };
  }
}

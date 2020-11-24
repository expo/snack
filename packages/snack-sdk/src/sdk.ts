import semver from 'semver';

import sdks from './sdks';
import { SDKVersion } from './types';

/**
 * Checks whether a specific module/dependency is preloaded for the given SDK version.
 */
export function isModulePreloaded(
  name: string,
  sdkVersion: SDKVersion,
  coreModulesOnly?: boolean
): boolean {
  const sdk = sdks[sdkVersion];
  if (!sdk) return false;
  return !!(sdk.coreModules[name] || (!coreModulesOnly && sdk.bundledModules[name]));
}

/**
 * Returns the list of pre-loaded modules for the given SDK version.
 */
export function getPreloadedModules(
  sdkVersion: SDKVersion,
  coreModulesOnly?: boolean
): { [name: string]: string } {
  const sdk = sdks[sdkVersion];
  if (!sdk) return {};
  return coreModulesOnly
    ? sdk.coreModules
    : {
        ...sdk.coreModules,
        ...sdk.bundledModules,
      };
}

export function validateSDKVersion(sdkVersion: SDKVersion): SDKVersion {
  if (Object.keys(sdks).indexOf(sdkVersion) < 0) {
    throw new Error(
      `Invalid SDKVersion, the following versions are supported: ${Object.keys(sdks)}`
    );
  }
  return sdkVersion;
}

/**
 * Returns the list of supported SDK versions.
 */
export function getSupportedSDKVersions(): SDKVersion[] {
  return Object.keys(sdks) as SDKVersion[];
}

/**
 * Verifies whether a string is a valid semver.
 */
export function isValidSemver(version: string): boolean {
  return version === 'latest' || !!semver.validRange(version);
}

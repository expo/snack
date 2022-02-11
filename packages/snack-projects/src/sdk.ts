import semver from 'semver';

import sdks from './sdks';
import features from './sdks/features';
import { SDKVersion, SDKFeature, SnackDependencies, SnackDependencyVersions } from './types';

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
 * Checks whether the module is deprecated for the given sdk-version and returns
 * the alternative module or error description instead. If the module is not deprecated
 * `undefined` is returned.
 */
export function getDeprecatedModule(name: string, sdkVersion: SDKVersion): string | undefined {
  return sdks[sdkVersion]?.deprecatedModules?.[name];
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

/**
 * Checks whether a feature is supported by the given SDK version.
 */
export function isFeatureSupported(feature: SDKFeature, sdkVersion: string): boolean {
  const featureVersion = features[feature];
  if (!featureVersion) {
    throw new Error(
      `Invalid SDKFeature, the following versions are supported: ${Object.keys(features)}`
    );
  }
  return semver.gte(sdkVersion, featureVersion);
}

/**
 * Converts older dependency formats into the SnackDependencies type.
 */
export function standardizeDependencies(dependencies: any): SnackDependencies {
  let result: SnackDependencies = dependencies;
  for (const name in dependencies) {
    const dep = dependencies[name];
    if (typeof dep === 'string') {
      result = result === dependencies ? { ...dependencies } : result;
      result[name] = {
        version: dep,
      };
    } else if (typeof dep === 'object') {
      const peerDependencies = standardizePeerDependencies(dep.peerDependencies);
      if (dep.peerDependencies !== peerDependencies) {
        result = result === dependencies ? { ...dependencies } : result;
        result[name] = {
          ...dep,
          peerDependencies,
        };
      }
    } else {
      // Invalid dependency
      result = result === dependencies ? { ...dependencies } : result;
      delete result[name];
    }
  }
  return result;
}

/**
 * @internal
 */
function standardizePeerDependencies(peerDependencies: any): SnackDependencyVersions {
  if (!peerDependencies) {
    return peerDependencies;
  }
  let result: SnackDependencyVersions = peerDependencies;
  for (const name in peerDependencies) {
    const peerDep = peerDependencies[name];
    if (typeof peerDep === 'string' || peerDep === null) {
      // :thumbsup: regular peer-dependency
    } else if (typeof peerDep === 'object' && typeof peerDep.version === 'string') {
      result = result === peerDependencies ? { ...peerDependencies } : result;
      result[name] = peerDep.version;
    } else {
      // Invalid peer-dependency
      result = result === peerDependencies ? { ...peerDependencies } : result;
      delete result[name];
    }
  }

  return result;
}

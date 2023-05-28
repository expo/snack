import Constants from 'expo-constants';
import { Platform } from 'react-native';

import * as Logger from '../Logger';
import FileSystem from '../NativeModules/FileSystem';

type SnackagerDependency = {
  /** The npm name of the dependency */
  name: string;
  /** The resolved exact version of the dependency */
  version: string;
  /** The handle or unique identifier of the dependency */
  identifier: string;
};

// Use the right Snackager based on `cloudEnv` setting in app.json
const SNACKAGER_CDN_STAGING = 'https://ductmb1crhe2d.cloudfront.net';
const SNACKAGER_CDN_PROD = 'https://d37p21p3n8r8ug.cloudfront.net';
const SNACKAGER_CDN =
  Constants.manifest?.extra?.cloudEnv !== 'production' ? SNACKAGER_CDN_STAGING : SNACKAGER_CDN_PROD;

/** TODO: refactor dependency definitions to be more consice */
export function getDependency(
  dependencyName: string,
  dependency: { resolved?: string; version: string; handle?: string }
): SnackagerDependency {
  // Based on https://github.com/expo/universe/blob/055b1f83685a0c4dd45c3b27a99114de0233c1b6/apps/snack/src/modules/ModuleManager.js#L191-L210
  const name = dependencyName[0] + dependencyName.slice(1).replace(/@[^@]+$/, '');
  const version = dependency.resolved ?? dependency.version;
  const identifier = dependency.handle ?? `${name}@${version}`.replace(/\//g, '~');

  return { name, version, identifier };
}

/**
 * Load the bundle code for a dependency from Snackager.
 * This also stores newly fetched dependencies in the local file system cache.
 */
export async function loadBundle(dependency: SnackagerDependency) {
  const cachedBundle = await loadCachedBundle(dependency);
  if (cachedBundle) {
    Logger.module(
      `Loaded dependency ${dependency.identifier} from cache (${cachedBundle.length} bytes)`
    );
    return cachedBundle;
  }

  Logger.module(`Fetching dependency ${dependency.identifier} ...`);
  const bundle = await fetchBundle(dependency);
  Logger.module(
    `Fetched dependency ${dependency.identifier}, storing in cache (${bundle.length} bytes)`
  );

  // Store the bundle in cache for future use, but we don't have to wait on that
  storeCachedBundle(dependency, bundle).catch((error) => {
    Logger.error('Failed to store dependency in cache', error);
  });

  return bundle;
}

// Snackager bundles

function getBundleUrl(dependency: SnackagerDependency) {
  return `${SNACKAGER_CDN}/${dependency.identifier}-${Platform.OS}/bundle.js`;
}

async function fetchBundle(dependency: SnackagerDependency) {
  const bundleUrl = getBundleUrl(dependency);
  const response = await fetch(bundleUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch bundle for ${dependency.identifier}. Response: ${response.status} - ${response.statusText}`
    );
  }

  return await response.text();
}

// Bundle cache

// client caches dependency resolutions locally, increment the cachebuster to invalidate existing caches
const CACHE_BUSTER = '2';

function getBundleCacheKey(dependency: SnackagerDependency) {
  const cacheIdentifier = dependency.identifier.replace(/\//g, '~');
  return `${FileSystem.cacheDirectory}snack-bundle-${CACHE_BUSTER}-${cacheIdentifier}-${Platform.OS}.js`;
}

async function loadCachedBundle(dependency: SnackagerDependency) {
  const bundleKey = getBundleCacheKey(dependency);
  const { exists } = await FileSystem.getInfoAsync(bundleKey);

  if (exists) {
    return await FileSystem.readAsStringAsync(bundleKey);
  }

  return null;
}

async function storeCachedBundle(dependency: SnackagerDependency, bundle: string) {
  const bundleKey = getBundleCacheKey(dependency);
  await FileSystem.writeAsStringAsync(bundleKey, bundle);
}

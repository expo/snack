import * as Files from '../Files';
import FileSystem from '../NativeModules/FileSystem';

type AssetDefinition = NonNullable<ReturnType<typeof Files.get>>;

// client caches dependency resolutions locally, increment the cachebuster to invalidate existing caches
const CACHE_BUSTER = '2';

function getAssetCacheKey(dependency: AssetDefinition) {
  const cacheIdentifier = dependency.identifier.replace(/\//g, '~');
  return `${FileSystem.cacheDirectory}snack-bundle-${CACHE_BUSTER}-${cacheIdentifier}-${Platform.OS}.js`;
}

async function loadCachedAsset(dependency: AssetDefinition) {
  const bundleKey = getAssetCacheKey(dependency);
  const { exists } = await FileSystem.getInfoAsync(bundleKey);

  if (exists) {
    return await FileSystem.readAsStringAsync(bundleKey);
  }

  return null;
}

async function storeCachedAsset(dependency: AssetDefinition, bundle: string) {
  const bundleKey = getBundleCacheKey(dependency);
  await FileSystem.writeAsStringAsync(bundleKey, bundle);
}

import querystring from 'querystring';
import validate from 'validate-npm-package-name';

import { getCoreExternals } from '../bundler/externals';

export type BundleRequest = {
  qualified: string;
  scope?: string | null;
  id: string;
  tag: string;
  deep?: string | null;
  platforms: string[];
  rebuild: boolean;
  bypassMetadataCache: boolean;
  versionSnackager: boolean;
  sdkVersion?: string;
};

// parses a bundle request, resulting in these fields:
//
// example: `/@expo/configurator/submodule@^1.0.0?platforms=ios,android
//
// scope: '@expo'
// id:    'configurator'
// deep:  'submodule'
// tag:   '^1.0.0'
// platforms: ['ios', 'android', 'web]
//
// all are optional except the id
export default function parseRequest(url: string): BundleRequest {
  const match = /^\/(?:@([^/?]+)\/)?([^@/?]+)(?:\/([^@]+?))?(?:@(.+?))?(?:\?(.+))?$/.exec(url);

  if (!match) {
    throw new Error('Failed to parse request');
  }

  const scope = match[1]; // matches scope in `@scope/package`
  const id = match[2]; // matches id in `@user/id` or `package`
  const deep = match[3]; // matches deep path in `package/debounce` or `package/debounce@^3.4.0`
  const tag = match[4] || 'latest'; // matches version number in `package@^3.4.0`
  const qs = match[5]; // matches the query string

  if (!id) {
    throw new Error('Failed to determine the module name');
  }

  if (deep && (deep.split(/[\\/]/).includes('..') || deep.includes('\\'))) {
    throw new Error('Package subpaths must remain inside the package directory.');
  }

  const qualified = scope ? `@${scope}/${id}` : id;
  const validPackageResult = validate(qualified);
  const validPackage =
    validPackageResult.validForNewPackages || validPackageResult.validForOldPackages;

  if (!validPackage || [scope, id].some((part) => part === '.' || part === '..')) {
    throw new Error(`Module '${qualified}' is not a valid package name`);
  }

  const query = qs ? querystring.parse(qs) : null;
  const deepQualified = `${qualified}${deep ? `/${deep}` : ''}`;

  if (getCoreExternals().includes(deepQualified)) {
    throw new Error(`Bundling core module '${deepQualified}' is prohibited`);
  }

  if (query?.platforms !== undefined && typeof query.platforms !== 'string') {
    throw new Error('Specify platforms once as a comma-separated list.');
  }
  const platforms = query?.platforms
    ? (query.platforms as string).split(',').filter((p) => p)
    : ['ios', 'android', 'web'];

  if (
    !platforms.length ||
    platforms.some((platform) => !['ios', 'android', 'web'].includes(platform))
  ) {
    throw new Error('Supported platforms are ios, android, and web.');
  }

  const sdkVersion = Array.isArray(query?.sdkVersion) ? query?.sdkVersion[0] : query?.sdkVersion;
  return {
    qualified,
    scope,
    id,
    tag,
    deep,
    platforms,
    rebuild: Boolean(
      query?.rebuild === 'true' &&
        (process.env.DEBUG_LOCAL_FILES || process.env.NODE_ENV === 'development'),
    ),
    bypassMetadataCache: Boolean(query?.bypassCache === 'true'),
    versionSnackager: Boolean(query?.version_snackager === 'true'),
    sdkVersion,
  };
}

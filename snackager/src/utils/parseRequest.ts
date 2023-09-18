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

  const validPackageResult = validate(id);
  const validPackage =
    validPackageResult.validForNewPackages ||
    !validPackageResult.warnings ||
    validPackageResult.warnings.every((warning) => warning.includes('is a core module name'));

  if (!validPackage) {
    throw new Error(`Module '${id}' is not a valid package name`);
  }

  const qualified = scope ? `@${scope}/${id}` : id;
  const query = qs ? querystring.parse(qs) : null;
  const deepQualified = `${qualified}${deep ? `/${deep}` : ''}`;

  if (getCoreExternals().includes(deepQualified)) {
    throw new Error(`Bundling core module '${deepQualified}' is prohibited`);
  }

  // TODO: check if query.platforms can be a `string[]`
  const platforms = query?.platforms
    ? (query.platforms as string).split(',').filter((p) => p)
    : ['ios', 'android', 'web'];

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
  };
}

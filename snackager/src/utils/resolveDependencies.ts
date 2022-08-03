import { isExternal } from '../bundler/externals';
import { Metadata, Package } from '../types';

// TODO: find the typescript definitions for this package, `@types/semver-utils` doesn't exists
const semverUtils = require('semver-utils');

// There are two special types of dependencies that should not be included in Snackager results.
// 1. "Ignored dependencies" - dependencies that are ok to include in the output, but should not be bundled.
// 2. "Hidden peer dependencies" - dependencies that should not be included in the output and the package definition, as including them would break things in the website
const IGNORED_DEPENDENCIES = ['react-native-windows'];
const HIDDEN_PEER_DEPENDENCIES = [
  '@babel/core', // required for react-native-reanimated@2.8.0
  '@babel/runtime', // required for @shopify/flash-list@1.2.0
];

type ResolvedDependencies = {
  pkg: Package;
  // TODO: fix possible `null` for dependency and replace this with `Package['dependencies']`
  dependencies: { [key: string]: string | null };
  hash: string;
  latestHash: string | null;
};

export default function resolveDependencies(
  meta: Metadata,
  version: string,
  isLatest: boolean,
  deep?: string | null
): ResolvedDependencies {
  const pkg = meta.versions[version];
  const { peerDependencies = {} } = pkg;
  const dependencies: { [key: string]: string | null } = {};

  for (const name in peerDependencies) {
    if (HIDDEN_PEER_DEPENDENCIES.includes(name)) {
      // hide from pkg
      delete pkg.peerDependencies?.[name];
    } else if (IGNORED_DEPENDENCIES.includes(name)) {
      // ignore
    } else if (name === 'react-native-vector-icons') {
      dependencies['@expo/vector-icons'] = null;
    } else {
      const range = peerDependencies[name];
      const semvers = semverUtils.parseRange(range);

      const last = semvers.pop();

      if (last) {
        let semver = semverUtils.stringify(last);

        if (last.operator === '>' || last.operator === '>=') {
          semver = `^${semver}`;
        }

        dependencies[name] = semver;
      } else {
        dependencies[name] = range;
      }
    }
  }

  // When the package has dependencies that are known to be external
  // then consider these to be "peer" dependencies as well.
  const deps = pkg.dependencies;
  if (deps) {
    for (const name in deps) {
      if (isExternal(name) && !dependencies[name] && !IGNORED_DEPENDENCIES.includes(name)) {
        dependencies[name] = deps[name];
      }
    }
  }

  const hash = `${pkg.name}${deep ? `/${deep}` : ''}@${version}`.replace(/\//g, '~');
  const latestHash = isLatest
    ? `${pkg.name}${deep ? `/${deep}` : ''}@latest`.replace(/\//g, '~')
    : null;

  return {
    pkg,
    dependencies,
    hash,
    latestHash,
  };
}

import { isExternal } from '../bundler/externals';
import { Metadata, Package } from '../types';

// TODO: find the typescript definitions for this package, `@types/semver-utils` doesn't exists
const semverUtils = require('semver-utils');

const IGNORED_DEPENDENCIES = ['react-native-windows'];

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
    if (IGNORED_DEPENDENCIES.includes(name)) {
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

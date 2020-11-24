/* @flow */

import mapValues from 'lodash/mapValues';

import { sdkSupportsFeature } from '../configs/sdkVersions';
import type { SDKVersion } from '../configs/sdkVersions';
import type { ExpoDependencyV2 } from '../types';

export const standardizeDependencies = (dependencies: ExpoDependencyV2, sdkVersion: SDKVersion) => {
  return convertDependencyFormat(
    dependencies,
    sdkSupportsFeature(sdkVersion, 'PROJECT_DEPENDENCIES')
  );
};

export const convertDependencyFormat = (dependencies: ExpoDependencyV2, shouldBeV2: boolean) => {
  const isV1 = _isV1(dependencies);
  if (shouldBeV2) {
    if (isV1) {
      return _convertDependenciesV1toV2(dependencies);
    } else {
      return dependencies;
    }
  } else {
    if (isV1) {
      return dependencies;
    } else {
      return _convertDependenciesV2toV1(dependencies);
    }
  }
};

const _isV1 = (dependencies) => {
  return Object.keys(dependencies).every((dep) => typeof dependencies[dep] === 'string');
};

const _convertDependenciesV1toV2 = (dependencies) =>
  mapValues(dependencies, (version) => {
    const result = {
      version,
      isUserSpecified: true,
    };
    if (version.resolved) {
      (result: Object).resolved = version.resolved;
    }
    return result;
  });

const _convertDependenciesV2toV1 = (dependencies) => mapValues(dependencies, (dep) => dep.version);

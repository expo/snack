import { isModulePreloaded } from 'snack-sdk';

import { SnackDependencies, SDKVersion } from '../types';

export default function (dependencyQueryParam: string, sdkVersion: SDKVersion): SnackDependencies {
  // If any initial dependencies were specified in query param, sync them
  // Dependencies will be in following format:
  // dependencies=lodash,redux@0.3.4,@expo/fonts@4.3.2
  return dependencyQueryParam.split(',').reduce((acc, curr) => {
    const first = curr.slice(0, 1);

    // remove the first letter so we don't match stuff like `@expo/` when splitting
    const [dep, version] = curr.slice(1).split('@');
    const name = first + dep;

    if (isModulePreloaded(name, sdkVersion, true)) {
      return acc;
    }

    return {
      ...acc,
      [name]: {
        version: (version || '*') ?? null,
      },
    };
  }, {});
}

/* @flow */

import { haste, dependencies } from '../configs/preloadedModules';
import type { SDKVersion } from '../configs/sdkVersions';

export default function isModulePreloaded(name: string, sdkVersion: SDKVersion) {
  if (haste.includes(name)) {
    return true;
  }

  if (!dependencies[sdkVersion]) {
    return false;
  }

  return name in dependencies[sdkVersion];
}

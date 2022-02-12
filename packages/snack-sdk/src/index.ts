import {
  SDKFeature,
  SDKVersion,
  SnackAssetFile,
  SnackCodeFile,
  SnackFile,
  SnackFiles,
  SnackDependency,
  SnackDependencyVersions,
  SnackDependencies,
  SnackMissingDependency,
  SnackMissingDependencies,
  isModulePreloaded,
  getPreloadedModules,
  isValidSemver,
  getSupportedSDKVersions,
  isFeatureSupported,
  standardizeDependencies,
  getDeprecatedModule,
} from 'snack-projects';

import Snack, {
  SnackOptions,
  SnackSaveOptions,
  SnackStateListener,
  SnackLogListener,
} from './Session';
import defaultConfig from './defaultConfig';

export * from './transports';
export * from './types';
export type { SnackOptions, SnackSaveOptions, SnackStateListener, SnackLogListener };
export {
  SDKFeature,
  SDKVersion,
  SnackAssetFile,
  SnackCodeFile,
  SnackFile,
  SnackFiles,
  SnackDependency,
  SnackDependencyVersions,
  SnackDependencies,
  SnackMissingDependency,
  SnackMissingDependencies,
  isModulePreloaded,
  getPreloadedModules,
  isValidSemver,
  getSupportedSDKVersions,
  isFeatureSupported,
  standardizeDependencies,
  getDeprecatedModule,
  defaultConfig,
  Snack,
};

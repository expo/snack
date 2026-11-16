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
  createRuntimeUrl,
  parseRuntimeUrl,
} from 'snack-content';

import Snack, {
  SnackOptions,
  SnackSaveOptions,
  SnackStateListener,
  SnackLogListener,
} from './Session';
import defaultConfig from './defaultConfig';
import { setSnackSDKFetch } from './utils';

export { selectSnackCompiler } from './Compiler';
export type {
  SnackCompilationInput,
  SnackCompiledArtifact,
  SnackCompiler,
  SnackCompilerOptions,
  SnackCompilerSelection,
} from './Compiler';

export * from './transports';
export * from './types';
export type {
  SnackOptions,
  SnackSaveOptions,
  SnackStateListener,
  SnackLogListener,
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
};
export {
  isModulePreloaded,
  getPreloadedModules,
  isValidSemver,
  getSupportedSDKVersions,
  isFeatureSupported,
  standardizeDependencies,
  getDeprecatedModule,
  defaultConfig,
  Snack,
  createRuntimeUrl,
  parseRuntimeUrl,
  setSnackSDKFetch,
};

export { createWorkerCompiler } from './WorkerCompiler';
export type { SnackWorkerRPC, WorkerCompilerMetric } from './WorkerCompiler';
export { createBrowserWorkerHost } from './BrowserWorkerHost';

export { createSnackArtifactStore } from './ArtifactStore';
export { loadCompiledArtifact, validateArtifactReference } from './Artifact';
export type { SnackArtifactReference, SnackArtifactStore, SnackArtifactDigest } from './Artifact';
export { loadSavedArtifactReference } from './SavedArtifact';

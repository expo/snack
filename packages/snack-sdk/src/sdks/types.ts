/**
 * Version of the sdk to use (e.g. "43.0.0").
 */
export type SDKVersion = '41.0.0' | '42.0.0' | '43.0.0' | '44.0.0';

/** @internal */
export type SDKSpec = {
  // Version-spec for the published "expo" package. This version is
  // used to fetch compatible package versions. The value is typically
  // in the form of "^39.0.0" but may also contain custom specs, such
  // as "40.0.0-beta.2".
  version: string;

  // Modules that are pre-loaded by the Snack runtime, and which
  // the user does not need to add to `package.json`.
  // The version for these packages is hardcoded as it cannot be
  // resolved using bundledNativeModules.json.
  coreModules: {
    [name: string]: string;
  };

  // Modules that are pre-loaded by the Snack runtime, but which
  // are expected to be added as a dependency anyway. This ensures
  // that `package.json` is up to date, when downloading the Snack
  // as a zip-file. These modules don't have versions defined, but
  // instead bundledNativeModules.json should be used to obtain
  // the recent version.
  bundledModules: {
    [name: string]: '*';
  };

  // Modules that have been deprecated. The value represents a valid
  // a description providing a solution or explanation (eg.
  // "expo-permissions": "Use permissions getters and requesters in specific modules instead...""
  deprecatedModules?: {
    [name: string]: string;
  };
};

/**
 * Feature that is supported by the SDK (e.g. "TYPESCRIPT").
 */
export type SDKFeature =
  | 'MULTIPLE_FILES'
  | 'PROJECT_DEPENDENCIES'
  | 'TYPESCRIPT'
  | 'UNIMODULE_IMPORTS'
  | 'POSTMESSAGE_TRANSPORT'
  | 'VERSIONED_SNACKAGER';

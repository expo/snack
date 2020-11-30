export type SDKVersion = '36.0.0' | '37.0.0' | '38.0.0' | '39.0.0' | '40.0.0';

export type SDKSpec = {
  version: SDKVersion;

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
};

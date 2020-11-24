/* @flow */

import semver from 'semver';

// minimum SDK versions that support snack features
const minFeatureVersion = {
  MULTIPLE_FILES: '21.0.0',
  PROJECT_DEPENDENCIES: '25.0.0',
  TYPESCRIPT: '31.0.0',
  UNIMODULE_IMPORTS: '33.0.0',
  POSTMESSAGE_TRANSPORT: '35.0.0',
  VERSIONED_SNACKAGER: '37.0.0',
};

// special casing of features that have been backported to particular SDK versions
export const versions = {
  '36.0.0': [],
  '37.0.0': [],
  '38.0.0': [],
  '39.0.0': [],
};

export const defaultSDKVersion = '39.0.0';

export type Feature = $Keys<typeof minFeatureVersion>;
export type SDKVersion = $Keys<typeof versions>;

export const sdkSupportsFeature = (sdkVersion: SDKVersion, feature: Feature) => {
  const versionsIncludeFeature = versions[sdkVersion]
    ? versions[sdkVersion].includes(feature)
    : false;
  const result = semver.gte(sdkVersion, minFeatureVersion[feature]) || versionsIncludeFeature;
  return result;
};

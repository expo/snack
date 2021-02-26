/**
 * Setting the value to `false` will hide the version from the version picker.
 * It can be selected by specifying `&version=99.0.0` in the URL. Ex: http://snack.expo.io?version=99.0.0
 * This is useful when deploying the website  with preliminary support for a new SDK version.
 */
export const versions: { [version: string]: boolean } = {
  '37.0.0': true,
  '38.0.0': true,
  '39.0.0': true,
  '40.0.0': true,
};

export const DEFAULT_SDK_VERSION = '40.0.0';
export const TEST_SDK_VERSION = '37.0.0';

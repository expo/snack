import { SDKVersion } from 'snack-sdk';

/**
 * Setting the value to `false` will hide the version from the version picker.
 * It can be selected by specifying `?sdkVersion=99.0.0` in the URL. Ex: http://snack.expo.dev?sdkVersion=99.0.0
 * This is useful when deploying the website  with preliminary support for a new SDK version.
 */
export const versions: Record<SDKVersion, boolean> = {
  '40.0.0': true,
  '41.0.0': true,
  '42.0.0': true,
  '43.0.0': true,
};

export const DEFAULT_SDK_VERSION: SDKVersion = '43.0.0';
export const TEST_SDK_VERSION: SDKVersion = '40.0.0';

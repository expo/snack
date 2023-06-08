import { defaultSdkVersion } from 'snack-content';
import { SDKVersion } from 'snack-sdk';

/**
 * Setting the value to `false` will hide the version from the version picker.
 * It can be selected by specifying `?sdkVersion=99.0.0` in the URL. Ex: http://snack.expo.dev?sdkVersion=99.0.0
 * This is useful when deploying the website  with preliminary support for a new SDK version.
 */
export const versions: Record<SDKVersion, boolean> = {
  '46.0.0': true,
  '47.0.0': true,
  '48.0.0': false,
};

export const DEFAULT_SDK_VERSION: SDKVersion = defaultSdkVersion;
export const TEST_SDK_VERSION: SDKVersion = '46.0.0';

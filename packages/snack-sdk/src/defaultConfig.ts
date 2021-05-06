import { SDKVersion, SnackState } from './types';

export const apiURL: string = 'https://exp.host';
export const snackagerURL: string = 'https://snackager.expo.io';
export const webPlayerURL: string =
  'https://snack-web-player.s3.us-west-1.amazonaws.com/v2/%%SDK_VERSION%%';

export const sdkVersion: SDKVersion = '41.0.0';

export const SnackIdentityState: SnackState = {
  sdkVersion,
  name: '',
  description: '',
  dependencies: {},
  missingDependencies: {},
  files: {},
  connectedClients: {},
  transports: {},
  disabled: false,
  unsaved: false,
  online: false,
  url: '',
  channel: '',
};

const defaultConfig = {
  apiURL,
  snackagerURL,
  sdkVersion,
  webPlayerURL,
};

export default defaultConfig;

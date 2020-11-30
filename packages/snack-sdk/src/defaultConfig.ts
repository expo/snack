import { SDKVersion, SnackState } from './types';

export const apiURL: string = 'https://exp.host';
export const snackagerURL: string = 'https://snackager.expo.io';
export const host: string = 'expo.io';

export const sdkVersion: SDKVersion = '39.0.0';

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
  host,
  sdkVersion,
};

export default defaultConfig;

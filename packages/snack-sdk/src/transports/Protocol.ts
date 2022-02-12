import { SDKVersion } from 'snack-projects';

export type Device = {
  name: string;
  id: string;
  platform: string;
};

export type ProtocolConsoleMessage = {
  type: 'CONSOLE';
  device: Device;
  method: 'log' | 'error' | 'warn';
  payload: any[];
};

export type ProtocolErrorMessage = {
  type: 'ERROR';
  error: string; // e.g. `{message: "my error", stack: "..."}`
  device: Device;
};

export type ProtocolResendCodeMessage = {
  type: 'RESEND_CODE';
  device: Device;
};

export type ProtocolCodeMessageDependencies = {
  [name: string]: {
    version: string; // original version
    resolved: string; // resolved version
    handle: string; // snackager handle
  };
};

export type ProtocolCodeMessage = {
  type: 'CODE';
  diff: { [path: string]: string };
  s3url: { [path: string]: string };
  dependencies: ProtocolCodeMessageDependencies;
  metadata: {
    expoSDKVersion: SDKVersion;
    webSnackSDKVersion: string;
    webHostname?: string; // window.location.hostname,
    webOSArchitecture?: string; // os.architecture,
    webOSFamily?: string; // os.family,
    webOSVersion?: string; // os.version,
    webLayoutEngine?: string; // platformInfo.layout,
    webDeviceType?: string; // platformInfo.product,
    webBrowser?: string; // platformInfo.name,
    webBrowserVersion?: string; // platformInfo.version,
    webDescription?: string; // platformInfo.description,
  };
};

export type ProtocolReloadMessage = {
  type: 'RELOAD_SNACK';
};

export type ProtocolRequestStatusMessage = {
  type: 'REQUEST_STATUS';
};

export type ProtocolStatusMessage = {
  type: 'STATUS_REPORT';
  previewLocation: string;
  status: 'FAILURE' | 'SUCCESS';
};

export type ProtocolOutgoingMessage =
  | ProtocolCodeMessage
  | ProtocolReloadMessage
  | ProtocolRequestStatusMessage;

export type ProtocolIncomingMessage =
  | ProtocolConsoleMessage
  | ProtocolErrorMessage
  | ProtocolResendCodeMessage
  | ProtocolStatusMessage;

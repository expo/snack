/**
 * @flow
 */

import type { SDKVersion } from './configs/sdkVersions';

type RequiredSnackFileAttributes = {
  contents: string,
  type: 'ASSET' | 'CODE',
};

type ExpoRequiredSnackFiles = {
  'app.js': RequiredSnackFileAttributes,
};

export type ExpoSnackFiles = {
  ...$Exact<ExpoRequiredSnackFiles>,
  ...{ [string]: RequiredSnackFileAttributes },
};

export type ExpoWebPlayer = {
  subscribe: () => void,
  unsubscribe: () => void,
  publish: (message: any) => void,
  listen: (listener: (message: any) => void) => void,
};

export type ExpoSnackSessionArguments = {
  files: ExpoSnackFiles,
  sdkVersion?: SDKVersion,
  verbose?: boolean,
  sessionId?: string, // Will be randomly generated if not provided
  host?: string,
  sessionSecret: string,
  snackId?: string,
  name?: string,
  description?: string,
  dependencies?: any, // TODO: more specific
  authorizationToken?: string,
  disableDevSession?: boolean,
  user: { idToken?: ?string, sessionSecret?: ?string },
  deviceId: ?string,
  player?: ExpoWebPlayer,
  isFocused?: boolean,
};

export type ExpoSubscription = {
  remove: () => void,
};

// Called with empty array if errors have been resolved
export type ExpoErrorListener = (errors: Array<ExpoError>) => void;

export type ExpoLogListener = (log: ExpoDeviceLog) => void;

export type ExpoPresenceListener = (event: ExpoPresenceEvent) => void;

export type ExpoStateListener = (event: ExpoStateEvent) => void;

export type ExpoDependencyErrorListener = (message: string) => void;

export type ExpoSendBeaconCloseRequest = {
  url: string,
  data: Blob,
};

export type ExpoSendBeaconCloseRequestListener = (closeRequest: ExpoSendBeaconCloseRequest) => void;

export type ExpoErrorLocation = {
  line: number,
  column: number,
};

export type ExpoPubnubError = {
  device?: ExpoDevice,
  loc?: ExpoErrorLocation,
  message?: string,
  stack?: string,
  line?: number,
  column?: number,
};

export type ExpoError = {
  device?: ExpoDevice,
  startLine?: number,
  endLine?: number,
  startColumn?: number,
  endColumn?: number,
  message: string,
  stack?: string,
};

export type ExpoPubnubDeviceLog = {
  type: 'CONSOLE',
  device: ExpoDevice,
  method: 'log' | 'error' | 'warn',
  payload: Array<any>,
};

// `console.log`, `console.warn`, `console.error`
export type ExpoDeviceLog = {
  device: ExpoDevice,
  method: 'log' | 'warn' | 'error',
  message: string,
  arguments: any, // the raw fields that were passed to the console.* call
};

export type ExpoDevice = {
  name: string,
  id: string,
  platform: string,
};

export type ExpoPresenceStatus = 'join' | 'leave';

export type ExpoPresenceEvent = {
  device: ExpoDevice,
  status: ExpoPresenceStatus,
};

export type ExpoStateEvent = {
  files: ExpoSnackFiles,
  sdkVersion: SDKVersion,
  name: ?string,
  description: ?string,
  dependencies: any, // TODO: more specific
  isSaved: boolean,
  isResolving: boolean,
};

export type ExpoDependencyV1 = { [name: string]: string };

export type ExpoDependencyV2 = {
  [name: string]: {
    version: string, // currently specific version, can expand to semver range, git url, snack url, js file on the web
    // isPeerDep: boolean, // may need to have importing snacks make sense
    resolved?: string, // result of snackager processing the resource
    isUserSpecified: boolean, // can adjust version to resolve peerDeps if false
    peerDependencies?: {
      [name: string]: {
        version: string,
      },
    },
  },
};

export type ExpoDependencyResponse = {
  name: string,
  version: string,
  handle: string,
  dependencies?: { [key: string]: string },
  error?: Error,
};

export type ExpoStatusResponse = {
  type: 'STATUS_REPORT',
  previewLocation: string,
  status: boolean,
};

export type ExpoMessagingListeners = {
  message(payload: {
    message:
      | ExpoPubnubDeviceLog
      | ExpoStatusResponse
      | { type: 'RESEND_CODE', device: ExpoDevice }
      | { type: 'ERROR', error?: string, device: ExpoDevice },
  }): void,

  presence(payload: { action: 'join' | 'leave' | 'timeout', uuid: string }): void,

  status(payload: {
    category:
      | 'PNConnectedCategory'
      | 'PNNetworkDownCategory'
      | 'PNNetworkIssuesCategory'
      | 'PNReconnectedCategory'
      | 'PNNetworkUpCategory',
  }): void,
};

export type Transport = 'PubNub' | 'postMessage';

export interface ExpoMessaging {
  addListener(options: ExpoMessagingListeners): void;

  publish(
    channel: string,
    message:
      | { type: 'RELOAD_SNACK' }
      | { type: 'REQUEST_STATUS' }
      | {
          type: 'LOADING_MESSAGE',
          message: string,
        }
      | {
          type: 'CODE',
          diff: { [key: string]: string },
          s3url: { [key: string]: string },
          dependencies: ExpoDependencyV2,
          metadata: { [key: string]: any },
        },
    transports: Transport[]
  ): Promise<any[]>;

  subscribe(channel: string, transports: Transport[]): void;

  unsubscribe(channel: string, transports: Transport[]): void;
}

export type Platform = 'android' | 'ios' | 'web';

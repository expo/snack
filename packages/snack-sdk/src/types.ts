import {
  SDKVersion,
  SnackDependencies,
  SnackDependencyVersions,
  SnackFiles,
  SnackMissingDependencies,
} from 'snack-content';

import { SnackTransport } from './transports';

/**
 * An error that can optionally hold a file-name and line/column location.
 */
export interface SnackError extends Error {
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export type SnackConnectedClientStatus = 'ok' | 'error' | 'reloading';

/**
 * Client which connected to the Snack.
 *
 * Clients are only able to connect when the Snack is `online`.
 */
export type SnackConnectedClient = {
  transport: string;
  id: string;
  name: string;
  platform: string;
  status: SnackConnectedClientStatus;
  error?: SnackError;
  previewURL?: string;
  previewTimestamp?: number;
};

/**
 * Collection of connected clients.
 */
export type SnackConnectedClients = {
  [key: string]: SnackConnectedClient;
};

/**
 * User that is used for communicating with the Expo servers.
 */
export type SnackUser = {
  sessionSecret?: string;
  accessToken?: string;
};

/**
 * Request data to be used with the `sendBeacon` API.
 */
export type SnackSendBeaconRequest = {
  url: string;
  data: any;
};

export type SnackListenerSubscription = () => any;

/**
 * Log data for when a connected client calls one of the
 * `console.[log,info,warn,error]` to log information to the
 * console.
 */
export type SnackLogEvent = {
  type: 'error' | 'warn' | 'log' | 'info';
  message: string;
  connectedClient?: SnackConnectedClient;
  error?: SnackError;
};

export type SnackWindowRef = {
  current: Window | null;
};

export type SnackState = {
  /**
   * Expo SDK version.
   */
  sdkVersion: SDKVersion;

  /**
   * Files that make up the content (code & assets) of the Snack. There should
   * always be a file called "App.js" or "App.tsx" as the main entry point.
   */
  files: SnackFiles;

  /**
   * Packages that can be used in the code files. Packages that are pre-loaded
   * by the sdk may be ommited, but it is recommended to add them anyway.
   */
  dependencies: SnackDependencies;

  /**
   * Optional name. The name is used when saving or downloading the Snack; and is used
   * for the onlineName property.
   */
  name: string;

  /**
   * Additional description of the Snack. The description is used when saving the Snack
   * and may also be used for searching purposes.
   */
  description: string;

  /**
   * Collection of dependencies that are missing but are required by one or more of
   * the dependencies.
   */
  missingDependencies: SnackMissingDependencies;

  /**
   * Collection of packages and versions that are compatible with the selected
   * SDK version. This is similar to using `expo install`, which ensures the latest
   * compatible version is installed.
   */
  wantedDependencyVersions?: SnackDependencyVersions;

  /**
   * Disabled state. When the Snack is disabled it will not resolve any dependencies
   * or upload any asset files. It also disables the ability to go online.
   */
  disabled: boolean;

  /**
   * When online is true, Expo clients can connect to the Snack and receive live updates
   * when code or dependencies are changed. It also makes the Snack visible in the
   * "Recently in Development" section of the Expo client.
   */
  online: boolean;

  /**
   * Communication channel ("pubnub") through which live updates are transferred.
   * The communication channel is only used when the Snack is "online".
   */
  channel: string;

  /**
   * Device-id of the Expo client. When set causes the Snack to be visible in the
   * "Recently in Development" section of the Expo client with that device-id.
   * The device-id is only used when the Snack is "online".
   */
  deviceId?: string;

  /**
   * Unique experience url which can be used to open the Expo client and connect
   * to the Snack (e.g. "exp://exp.host/@snack/sdk.38.0.0-78173941").
   */
  url: string;

  /**
   * Name of the Snack as shown in the "Recently in Development" section in the
   * Expo client. The online-name will be empty when the Snack is not "online".
   */
  onlineName?: string;

  /**
   * A close request that should be send using the browser `sendBeacon` API
   * whenever the browser session is unloaded. This gives the Snack a last opportunity
   * to gracefully close its connections so that the "Recently in Development"
   * section in the Expo client no longer shows the Snack.
   */
  sendBeaconCloseRequest?: SnackSendBeaconRequest;

  /**
   * @internal
   */
  transports: { [id: string]: SnackTransport };

  /**
   * Clients that are currently connected.
   */
  connectedClients: SnackConnectedClients;

  /**
   *
   */
  user?: SnackUser;

  /**
   * Unsaved status of the Snack. Becomes `true` when the Snack code is changed and
   * `false` whenever the Snack is saved.
   */
  unsaved: boolean;

  /**
   * Full name of the saved Snack.
   */
  id?: string;

  /**
   * Id of this version of the saved Snack. Each Snack can have many different versions or revisions, each revision has its own snackId.
   */
  snackId?: string;

  /**
   * Id of a Snack saved to an account. This id points to the latest version of a Snack revision and associated user.
   */
  accountSnackId?: string;

  /**
   * URL of the saved Snack.
   * The URL is empty when no save "id" is available.
   */
  saveURL?: string;

  /**
   * Last saved (non-draft) Expo SDK version.
   */
  savedSDKVersion?: string;

  /**
   * URL to use to when loading the web-preview in an iframe.
   *
   * Web-preview is supported from SDK 40 and higher.
   * To enable it, set the `webPreviewRef` to the contentWindow
   * of the iframe.
   */
  webPreviewURL?: string;

  /**
   * The runtime URL to serve webPlayer.
   */
  webPlayerURL?: string;
};

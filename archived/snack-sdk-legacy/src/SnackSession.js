/**
 * @flow
 *
 * This tag is needed to prevent PubNub from showing up in docs
 * @private
 */

import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import pickBy from 'lodash/pickBy';
import pull from 'lodash/pull';
import semver from 'semver';
import shortid from 'shortid';
import validate from 'validate-npm-package-name';

import createMessaging from './Messaging';
import { defaultSDKVersion, sdkSupportsFeature } from './configs/sdkVersions';
import type { SDKVersion, Feature } from './configs/sdkVersions';
import type {
  ExpoSnackFiles,
  ExpoSnackSessionArguments,
  ExpoSubscription,
  ExpoErrorListener,
  ExpoLogListener,
  ExpoPresenceStatus,
  ExpoPresenceListener,
  ExpoPubnubError,
  ExpoError,
  ExpoPubnubDeviceLog,
  ExpoDeviceLog,
  ExpoDevice,
  ExpoStateListener,
  ExpoDependencyErrorListener,
  ExpoDependencyV2,
  ExpoDependencyResponse,
  ExpoStatusResponse,
  ExpoMessaging,
  ExpoSendBeaconCloseRequest,
  ExpoSendBeaconCloseRequestListener,
  Transport,
} from './types';
import * as DevSession from './utils/DevSession';
import createLogger from './utils/Logger';
import type { Logger } from './utils/Logger';
import constructExperienceURL from './utils/constructExperienceURL';
import getSupportedVersion from './utils/getSupportedVersion';
import isModulePreloaded from './utils/isModulePreloaded';
import { convertDependencyFormat } from './utils/projectDependencies';
import sendFileUtils from './utils/sendFileUtils';

let platform = null;
// + and - are used as delimiters in the uri, ensure they do not appear in the channel itself
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!_');

type InitialState = {
  files: ExpoSnackFiles,
  name: ?string,
  description: ?string,
  dependencies: ExpoDependencyV2,
  sdkVersion?: SDKVersion,
};

const MIN_CHANNEL_LENGTH = 6;
const DEBOUNCE_INTERVAL = 1000;
const MAX_PUBNUB_SIZE = 31500;
const S3_BUCKET_URL = 'https://snack-code-uploads';

type UserT = { idToken?: ?string, sessionSecret?: ?string };

/**
 * Creates a snack session on the web. Multiple mobile devices can connect to the same session and each one will be updated when new code is pushed.
 * @param {object} options
 * @param {ExpoSnackFiles} options.files The initial React Native code.
 * @param {string} [options.name] Name shown if this Snack is saved.
 * @param {string} [options.description] Descriptions shown if this Snack is saved.
 * @param {string} [options.sessionId] Can be specified if you want a consistent url. This is a global namespace so make sure to use a UUID or scope it somehow if you use this.
 * @param {string} [options.sdkVersion] Determines what version of React Native is used on the mobile client. Defaults to 15.0.0 which maps to React Native 0.42.0. If you specify a different version, make sure to save that version along with the code. Code from one SDK version is not guaranteed to work on others.
 * @param {boolean} [options.verbose] Enable verbose logging mode.
 */
// host and snackId are not included in the docs since they are only used internally.
export default class SnackSession {
  files: ExpoSnackFiles;
  s3code: { [key: string]: string };
  diff: { [key: string]: string };
  s3url: { [key: string]: string };
  snackId: ?string;
  sdkVersion: SDKVersion;
  isVerbose: boolean;
  isStarted: boolean;
  logger: Logger;
  messaging: ExpoMessaging;
  channel: string;
  errorListeners: Array<ExpoErrorListener> = [];
  logListeners: Array<ExpoLogListener> = [];
  presenceListeners: Array<ExpoPresenceListener> = [];
  stateListeners: Array<ExpoStateListener> = [];
  dependencyErrorListener: ExpoDependencyErrorListener;
  sendBeaconCloseRequestListener: ExpoSendBeaconCloseRequestListener;
  host: string;
  name: ?string;
  description: ?string;
  dependencies: ExpoDependencyV2; // TODO: more specific
  initialState: InitialState;
  isResolving: boolean;
  expoApiUrl: string;
  snackagerUrl: string;
  snackagerCloudfrontUrl: string;
  authorizationToken: ?string; // to user
  sessionSecret: ?string; // to user
  loadingMessage: ?string;
  user: UserT; // dev
  deviceId: ?string; // dev
  disableDevSession: boolean;
  pubNubEnabled: boolean = false;
  openedAt: number;
  isFocused: ?boolean;

  // Public API
  constructor(options: ExpoSnackSessionArguments) {
    // TODO: check to make sure code was passed in

    this.disableDevSession = options.disableDevSession || false;
    this.isResolving = false;

    this.files = options.files;
    this.diff = {};
    this.s3url = {};
    this.s3code = {};
    this.sdkVersion = options.sdkVersion || defaultSDKVersion;
    this.isVerbose = !!options.verbose;
    this.logger = createLogger(this.isVerbose);
    this.channel = options.sessionId || shortid.generate();
    this.host = options.host || 'exp.host';
    this.expoApiUrl = 'https://exp.host';
    this.snackagerUrl = 'https://snackager.expo.io';
    this.snackagerCloudfrontUrl = 'https://d37p21p3n8r8ug.cloudfront.net';
    if (options.authorizationToken) {
      console.warn('authorizationToken has been deprecrated. see options.user');
    }
    if (options.sessionSecret) {
      console.warn('sessionSecret has been deprecrated. see options.user');
    }
    this.user = options.user || {};
    this.user = {
      ...{
        idToken: options.authorizationToken,
        sessionSecret: options.sessionSecret,
      },
      ...this.user,
    };
    this.deviceId = options.deviceId;
    this.isFocused = options.isFocused;
    this.openedAt = Date.now();

    this.snackId = options.snackId;
    this.name = options.name;
    this.description = options.description;
    this.dependencies = options.dependencies || {};
    this.initialState = cloneDeep({
      files: options.files,
      name: this.name,
      description: this.description,
      dependencies: this.dependencies,
      sdkVersion: this.sdkVersion,
    });

    if (this.channel.length < MIN_CHANNEL_LENGTH) {
      throw new Error('Please use a channel id with more entropy');
    }

    this.messaging = createMessaging({
      player: options.player,
      logger: this.logger,
    });

    this.messaging.addListener({
      message: ({ message }) => {
        this.logger.comm('Message received', message);
        switch (message.type) {
          case 'CONSOLE':
            this._handleLogMessage(message);
            break;
          case 'ERROR':
            this._handleErrorMessage(message);
            break;
          case 'RESEND_CODE':
            this._handleResendCodeMessage(message.device);
            break;
          case 'STATUS_REPORT':
            this._handleStatusReport(message);
            break;
        }
      },
      presence: ({ action, uuid }) => {
        let device;

        try {
          device = JSON.parse(uuid);
        } catch (e) {
          // Wasn't from the device
          return;
        }

        switch (action) {
          case 'join':
            this.logger.comm('Device connected', device);
            this._handleJoinMessage(device);
            break;
          case 'timeout':
          case 'leave':
            this.logger.comm('Device disconnected', action, device);
            this._handleLeaveMessage(device);
            break;
        }
      },
      status: ({ category }) => {
        //this.logger.comm('Status changed to', category);
        switch (category) {
          case 'PNConnectedCategory':
            break;
          case 'PNNetworkDownCategory':
          case 'PNNetworkIssuesCategory':
            this.logger.comm('Lost network connection.');
            break;
          case 'PNReconnectedCategory':
            this.logger.comm('Reconnected to PubNub server.');
            break;
          case 'PNNetworkUpCategory':
            this.logger.comm('Detected network connection. Subscribing to channel.');
            this._subscribe();
            break;
        }
      },
    });
    this.logger.info('Session created', this.initialState);
  }

  /**
   * Starts the session.
   * @returns {Promise.<void>} A promise that resolves when the session is started.
   * @function
   */
  startAsync = async (): Promise<void> => {
    this.isStarted = true;
    this._subscribe();
    this._startDevSessionAsync();
  };

  /**
   * Stops the session.
   * @returns {Promise.<void>} A promise that resolves when the session is stopped.
   * @function
   */
  stopAsync = async (): Promise<void> => {
    this.s3url = {};
    this._unsubscribe();
    await this._stopDevSession();
  };

  _startDevSessionAsync = (): Promise<void> => {
    if (this.disableDevSession) {
      return new Promise(() => {});
    }
    return DevSession.startSessionAsync({
      name: this.name,
      snackId: this.snackId,
      sdkVersion: this.sdkVersion,
      channel: this.channel,
      host: this.host,
      apiUrl: this.expoApiUrl,
      user: this.user,
      deviceId: this.deviceId,
      openedAt: this.openedAt,
      onSendBeaconCloseRequest: this._handleSendBeaconCloseRequest,
    });
  };

  _updateDevSession = (): Promise<void> => {
    // stub for future update
    return this._startDevSessionAsync();
  };

  _stopDevSession = async () => {
    await DevSession.stopSession({
      name: this.name,
      snackId: this.snackId,
      sdkVersion: this.sdkVersion,
      channel: this.channel,
      host: this.host,
      apiUrl: this.expoApiUrl,
      user: this.user,
      deviceId: this.deviceId,
      openedAt: this.openedAt,
    });
  };

  /**
   * Returns a url that will open the current Snack session in the Expo client when opened on a phone. You can create a QR code from this link or send it to the phone in another way. See https://github.com/expo/snack-sdk/tree/master/example for how to turn this into a QR code.
   * @returns {Promise.<void>} A promise that contains the url when fulfilled.
   * @function
   */
  getUrlAsync = async (): Promise<string> => {
    const url = constructExperienceURL({
      sdkVersion: this.sdkVersion,
      snackId: this.snackId,
      channel: this.channel,
      host: this.host,
    });

    return url;
  };

  /**
   * Upload an asset file that will be available in each connected mobile client
   *
   * @param {Promise.<https://developer.mozilla.org/en-US/docs/Web/API/File>}
   * @returns {Promise.<string>} A promise that contains the url when fulfilled
   * @function
   */
  uploadAssetAsync = async (content: Object): Promise<string> => {
    return sendFileUtils.uploadAssetToS3(content, this.expoApiUrl, this.logger);
  };

  /**
   * Push new code to each connected mobile client. Any clients that connect in the future will also get the new code.
   * @param {ExpoSnackFiles} files The new React Native code.
   * @returns {Promise.<void>} A promise that resolves when the code has been sent. Does not wait for the mobile clients to update before resolving.
   * @function
   */

  // TODO: parallelize
  sendCodeAsync = async (files: ExpoSnackFiles): Promise<void> => {
    // remove files that are no longer present in the code
    for (const key in this.files) {
      if (!files.hasOwnProperty(key)) {
        this.logger.module('File removed', key);
        delete this.diff[key];
        delete this.files[key];
      }
    }

    // and add or update the files in the provided code
    for (const key in files) {
      if (!this.files[key] || this.files[key] !== files[key]) {
        this.logger.module('File', this.files[key] ? 'updated' : 'added', key, files[key]);
        this.files[key] = files[key];
        if (this.files[key].type === 'ASSET' && typeof this.files[key].contents === 'object') {
          this.files[key].contents = await sendFileUtils.uploadAssetToS3(
            this.files[key].contents,
            this.expoApiUrl,
            this.logger
          );
        }
      }
    }

    this._publish();
    this._sendStateEvent();
  };

  downloadAsync = async () => {
    const url = `${this.expoApiUrl}/--/api/v2/snack/download`;
    const save = await this.saveAsync();
    const id = save.id;
    return { url: url + '/' + id };
  };

  reloadSnack = async () => {
    try {
      this.logger.info('Reloading...');
      await this.messaging.publish(
        this.channel,
        { type: 'RELOAD_SNACK' },
        this._getTransportsForPublish()
      );
      this.logger.info('Reloaded successfully!');
    } catch (e) {
      this.logger.error('Failed to reload app', e);
    }
  };

  // TODO: error when changing SDK to an unsupported version
  setSdkVersion = (sdkVersion: SDKVersion): void => {
    if (this.sdkVersion !== sdkVersion) {
      this.sdkVersion = sdkVersion;
      this.openedAt = Date.now();

      this._sendStateEvent();
      this._updateDevSession();
    }
  };

  setName = (name: string): void => {
    if (this.name !== name) {
      this.name = name;
      this.openedAt = Date.now();

      this._updateDevSession();
      this._sendStateEvent();
    }
  };

  setUser = (user: UserT): void => {
    if (this.user !== user) {
      this.user = user;
      this.openedAt = Date.now();

      this._updateDevSession();
      this._sendStateEvent();
    }
  };

  setDescription = (description: string): void => {
    if (this.description !== description) {
      this.description = description;

      this._sendStateEvent();
    }
  };

  setSessionSecret = (sessionSecret: ?string): void => {
    console.warn('sessionSecret has been deprecrated. see options.user');
    this.setUser({ sessionSecret });

    this._updateDevSession();
    this._sendStateEvent();
  };

  setAuthorizationToken = (token: ?string): void => {
    console.warn('authorizationToken has been deprecrated. see options.user');
    this.setUser({ idToken: token });

    this._updateDevSession();
    this._sendStateEvent();
  };

  setDeviceId = (deviceId: string): Promise<mixed> => {
    this.deviceId = deviceId;
    return this._updateDevSession();
  };

  setPubNubEnabled = () => {
    if (!this.pubNubEnabled) {
      this._unsubscribe();
      this.pubNubEnabled = true;
      this._subscribe();
    }
  };

  setFocus = (isFocused: boolean) => {
    const now = Date.now();
    this.isFocused = isFocused; // Isn't used yet, but can be used for presence mngt in the future
    if (isFocused && now !== this.openedAt) {
      this.openedAt = now;
      return this._updateDevSession();
    }
  };

  /**
   * Add a listener to get notified of error events.
   * @param {function(array)} callback - The callback that handles new error events. If there are no errors this will be called with an empty array. Otherwise will be called with an array of objects that each contain a `message` field.
   * @returns {object} A subscription object. Call `.remove()` on this object so stop getting new events.
   * @function
   */
  addErrorListener = (listener: ExpoErrorListener): ExpoSubscription => {
    this.errorListeners.push(listener);
    return {
      remove: () => {
        pull(this.errorListeners, listener);
      },
    };
  };

  /**
   * Add a listener to get notified of log events.
   * @param {function(object)} callback - The callback that handles new log events. Will be called with an object containing a `message` field.
   * @returns {object} A subscription object. Call `.remove()` on this object so stop getting new events.
   * @function
   */
  addLogListener = (listener: ExpoLogListener): ExpoSubscription => {
    this.logListeners.push(listener);
    return {
      remove: () => {
        pull(this.logListeners, listener);
      },
    };
  };

  /**
   * Add a listener to get notified of presence events.
   * @param {function(object)} callback - The callback that handles new presence events. Will be called with an object containing a `status` field.
   * @returns {object} A subscription object. Call `.remove()` on this object so stop getting new events.
   * @function
   */
  addPresenceListener = (listener: ExpoPresenceListener): ExpoSubscription => {
    this.presenceListeners.push(listener);
    return {
      remove: () => {
        pull(this.presenceListeners, listener);
      },
    };
  };

  addStateListener = (listener: ExpoStateListener): ExpoSubscription => {
    this.stateListeners.push(listener);
    return {
      remove: () => {
        pull(this.stateListeners, listener);
      },
    };
  };

  /**
   * Uploads the current code to Expo's servers and return a url that points to that version of the code.
   * @returns {Promise.<object>} A promise that contains an object with a `url` field when fulfilled.
   * @function
   */

  saveAsync = async (options?: { isDraft: boolean } = { isDraft: false }) => {
    const url = `${this.expoApiUrl}/--/api/v2/snack/save`;
    const manifest: {
      sdkVersion: string,
      name: ?string,
      description: ?string,
      dependencies?: Object,
    } = {
      sdkVersion: this.sdkVersion,
      name: this.name,
      description: this.description,
    };

    manifest.dependencies = convertDependencyFormat(this.dependencies, false);

    const payload = {
      manifest,
      code: this.files,
      dependencies: this.dependencies,
      isDraft: options.isDraft,
    };

    this.logger.info('Saving...', payload);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          ...(this.user.idToken ? { Authorization: `Bearer ${this.user.idToken}` } : {}),
          ...(this.user.sessionSecret ? { 'Expo-Session': this.user.sessionSecret } : {}),
        },
      });
      const data = await response.json();

      if (data.id) {
        this.logger.info('Saved', data);
        this.initialState = cloneDeep({
          sdkVersion: this.sdkVersion,
          files: this.files,
          name: this.name,
          description: this.description,
          dependencies: this.dependencies,
        });
        this._sendStateEvent();
        let fullName;
        if (data.id.match(/.*\/.*/)) {
          fullName = data.id;
        } else {
          fullName = `@snack/${data.id}`;
        }

        this._requestStatus();
        this.snackId = data.id;
        return {
          id: data.id,
          url: `https://expo.dev/${fullName}`,
        };
      } else {
        throw new Error(
          (data.errors && data.errors[0] && data.errors[0].message) || 'Failed to save code'
        );
      }
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  };

  _requestStatus = () => {
    if (!this.messaging) {
      return;
    }

    try {
      this.messaging.publish(
        this.channel,
        { type: 'REQUEST_STATUS' },
        this._getTransportsForPublish()
      );
    } catch (e) {
      this.logger.error('Failed to request status', e);
    }
  };

  getState = () => {
    return {
      files: this.files,
      sdkVersion: this.sdkVersion,
      name: this.name,
      description: this.description,
      dependencies: this.dependencies,
      isSaved: this._isSaved(),
      isResolving: this.isResolving,
      loadingMessage: this.loadingMessage,
    };
  };

  getChannel = () => {
    return this.channel;
  };

  supportsFeature = (feature: Feature) => {
    return sdkSupportsFeature(this.sdkVersion, feature);
  };

  /**
   * Adds a given module, along with any required peer dependencies, to the current project
   * Reports errors to any registered DependendencyErrorListeners
   * @returns {Promise<void>}
   * @function
   */
  addModuleAsync = async (name: string, version?: string): Promise<void> => {
    this.logger.module('Adding dependency', name, version, '...');
    const install = async () => {
      try {
        this.dependencies = await this._addModuleAsync(name, version, this.dependencies);
        this.logger.module('Added dependency', name, version, this.dependencies);
      } finally {
        this._sendStateEvent();
        this._publish();
      }
    };

    return (this._lastInstall = this._lastInstall.then(install, install));
  };

  removeModuleAsync = async (name: string): Promise<void> => {
    this.dependencies = pickBy(this.dependencies, (value, key: string) => key !== name);
    this.logger.module('Removed dependency', name, this.dependencies);
    this._sendStateEvent();
    this._publish();
  };

  /**
   * Sync list of dependencies and add new peer dependencies to the current project
   * Reports errors to any registered DependendencyErrorListeners
   * @returns {Promise<void>}
   * @function
   */
  syncDependenciesAsync = async (
    modules: { [name: string]: ?string },
    onError: (name: string, e: Error) => mixed
  ): Promise<void> => {
    this.logger.module('Synchronizing dependencies', modules);
    const sync = async () => {
      let dependencies = pickBy(this.dependencies, (value, name: string) =>
        // Only keep dependencies in the modules list
        modules.hasOwnProperty(name)
      );

      // Install any new dependencies in series
      for (const name of Object.keys(modules)) {
        try {
          dependencies = await this._addModuleAsync(name, modules[name], dependencies);
        } catch (e) {
          onError(name, e);
        }
      }

      // Don't update state if nothing changed
      if (!isEqual(dependencies, this.dependencies)) {
        // Update dependencies list
        this.dependencies = dependencies;
        this.logger.module('Synchronized dependencies', this.dependencies);

        // Notify listeners
        this._sendStateEvent();
        this._publish();
      } else {
        this.logger.module('Synchronized dependencies (no changes)');
      }
    };

    // Queue multiple syncs
    return (this._lastModuleSync = this._lastModuleSync.then(sync, sync));
  };

  // Private methods and properties
  _lastInstall: Promise<void> = Promise.resolve();
  _lastModuleSync: Promise<void> = Promise.resolve();

  _sendErrorEvent = (errors: Array<ExpoError>): void => {
    this.errorListeners.forEach((listener) => listener(errors));
  };

  _sendLogEvent = (log: ExpoDeviceLog): void => {
    this.logListeners.forEach((listener) => listener(log));
  };

  _sendPresenceEvent = (device: ExpoDevice, status: ExpoPresenceStatus): void => {
    this.presenceListeners.forEach((listener) =>
      listener({
        device,
        status,
      })
    );
  };

  _isSaved = (): boolean => {
    const { files, name, description, dependencies, sdkVersion, initialState } = this;

    return isEqual(initialState, {
      files,
      name,
      description,
      dependencies,
      sdkVersion,
    });
  };

  _sendStateEvent = (): void => {
    this.stateListeners.forEach((listener) => listener(this.getState()));
  };

  _subscribe = () => {
    const transports: Transport[] = ['postMessage'];

    if (this.pubNubEnabled) {
      transports.push('PubNub');
    }

    this.messaging.subscribe(this.channel, transports);
  };

  _unsubscribe = () => {
    const transports: Transport[] = ['postMessage'];

    if (this.pubNubEnabled) {
      transports.push('PubNub');
    }

    this.messaging.unsubscribe(this.channel, transports);
  };

  //s3code: cache of code saved on s3
  //s3url: url to code stored on s3
  //diff: code diff sent to phone
  _handleUploadCodeAsync = async () => {
    const fileSize = [];
    await this._uploadHelper(fileSize);

    let size = sendFileUtils.calcPayloadSize(this.channel, {
      diff: this.diff,
      s3url: this.s3url,
    });

    //TODO: make this async
    // If payload size is too big, upload code to s3 (starting from largest file)
    if (size > MAX_PUBNUB_SIZE) {
      fileSize.sort((a, b) => a.size - b.size);
      while (size > MAX_PUBNUB_SIZE && fileSize.length) {
        const key = fileSize.pop().name;
        this.s3code[key] = this.files[key].contents;
        this.diff[key] = '';
        this.s3url[key] = await sendFileUtils.uploadCodeToS3(
          this.files[key].contents,
          this.expoApiUrl,
          this.logger
        );
        size = sendFileUtils.calcPayloadSize(this.channel, {
          diff: this.diff,
          s3url: this.s3url,
        });
      }
    }
  };

  // Turn files into diff, s3url, and s3code
  _uploadHelper = async (fileSize: Array<Object>) => {
    await Promise.all(
      Object.keys(this.files).map(async (key) => {
        if (!this.files[key]) {
          return;
        } else if (typeof this.files[key].contents === 'object') {
          // Upload Asset to S3
          this.s3code[key] = this.files[key].contents;
          this.diff[key] = '';
          this.s3url[key] = await sendFileUtils.uploadAssetToS3(
            this.files[key].contents,
            this.expoApiUrl,
            this.logger
          );
        } else if (this.files[key].contents.startsWith(S3_BUCKET_URL)) {
          // Asset is already uploaded
          this.diff[key] = '';
          this.s3code[key] = this.files[key].contents;
          this.s3url[key] = this.files[key].contents;
        } else if (this.s3url[key]) {
          // Send diff against code on s3
          this.diff[key] = sendFileUtils.getFileDiff(this.s3code[key], this.files[key].contents);
        } else {
          // Send all of the code in diff (file small enough not to be uploaded)
          this.diff[key] = sendFileUtils.getFileDiff('', this.files[key].contents);
        }
        fileSize.push({ name: key, size: this.diff[key].length });
      })
    );
  };

  _handleLogMessage = (pubnubEvent: ExpoPubnubDeviceLog) => {
    const payload = pubnubEvent.payload || [];

    const message = {
      device: pubnubEvent.device,
      method: pubnubEvent.method,
      message: payload.join(' '),
      arguments: payload,
    };
    this._sendLogEvent(message);
  };

  _handleErrorMessage = ({ error, device }: { error?: string, device: ExpoDevice }) => {
    if (error) {
      const rawErrorObject: ExpoPubnubError = JSON.parse(error);
      const errorObject: ExpoError = {
        message: rawErrorObject.message || '',
        device,
        stack: rawErrorObject.stack,
      };

      if (rawErrorObject.line) {
        errorObject.startLine = rawErrorObject.line;
        errorObject.endLine = rawErrorObject.line;
      }

      if (rawErrorObject.column) {
        errorObject.startColumn = rawErrorObject.column;
        errorObject.endColumn = rawErrorObject.column;
      }

      if (rawErrorObject.loc) {
        errorObject.startLine = rawErrorObject.loc.line;
        errorObject.endLine = rawErrorObject.loc.line;
        errorObject.startColumn = rawErrorObject.loc.column;
        errorObject.endColumn = rawErrorObject.loc.column;
      }

      this._sendErrorEvent([errorObject]);
    } else {
      this._sendErrorEvent([]);
    }
  };

  _handleResendCodeMessage = (device: ExpoDevice) => {
    // Wrokaround for bug where we might not have received "join"
    this._handleDeviceDisconnect(device);
    this._publishNotDebouncedAsync();
  };

  _handleStatusReport = async (message: ExpoStatusResponse) => {
    const url = `${this.expoApiUrl}/--/api/v2/snack/updateMetadata`;
    const { previewLocation, status } = message;
    const payload = {
      id: this.snackId,
      previewLocation,
      status,
    };
    this.logger.info('Uploading preview...', payload);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.id) {
        this.logger.info('Uploaded preview', data);
        return {
          id: data.id,
        };
      } else {
        throw new Error(
          (data.errors && data.errors[0] && data.errors[0].message) || 'Failed to save code'
        );
      }
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  };

  _connectedDevices: ExpoDevice[] = [];

  _getTransportsForPublish = (): Transport[] => {
    let transports: Transport[];

    if (this.supportsFeature('POSTMESSAGE_TRANSPORT')) {
      transports = this._connectedDevices.map((d) =>
        d.platform === 'web' ? 'postMessage' : 'PubNub'
      );
    } else {
      transports = ['PubNub'];
    }

    return transports.filter((transport) => {
      if (transport === 'PubNub') {
        return this.pubNubEnabled;
      }

      return true;
    });
  };

  _handleDeviceConnect = (device: ExpoDevice) => {
    if (!this._connectedDevices.some((d) => d.id === device.id)) {
      this._connectedDevices.push(device);
    }
  };

  _handleDeviceDisconnect = (device: ExpoDevice) => {
    if (!this._connectedDevices.some((d) => d.id === device.id)) {
      this._connectedDevices.push(device);
    }
  };

  _handleSendBeaconCloseRequest = (closeRequest: ExpoSendBeaconCloseRequest) => {
    if (this.sendBeaconCloseRequestListener) {
      this.sendBeaconCloseRequestListener(closeRequest);
    }
  };

  _handleJoinMessage = (device: ExpoDevice) => {
    this._handleDeviceConnect(device);
    this._publishNotDebouncedAsync();
    this._sendPresenceEvent(device, 'join');
  };

  _handleLeaveMessage = (device: ExpoDevice) => {
    this._handleDeviceDisconnect(device);
    this._sendPresenceEvent(device, 'leave');
  };

  _publishNotDebouncedAsync = async () => {
    if (this.loadingMessage) {
      this._sendLoadingEvent();
    } else {
      if (this.isResolving) {
        // shouldn't ever happen
        return;
      }

      const metadata = this._getAnalyticsMetadata();

      await this._handleUploadCodeAsync();

      try {
        this.messaging.publish(
          this.channel,
          {
            type: 'CODE',
            diff: cloneDeep(this.diff),
            s3url: cloneDeep(this.s3url),
            dependencies: this.dependencies,
            metadata,
          },
          this._getTransportsForPublish()
        );

        this.logger.info('Published successfully!');
      } catch (e) {
        this.logger.error('Failed to send code', e);
      }
    }
  };

  _sendLoadingEvent = () => {
    if (!this.loadingMessage) {
      return;
    }

    if (!this.messaging) {
      return;
    }

    try {
      this.messaging.publish(
        this.channel,
        {
          type: 'LOADING_MESSAGE',
          message: this.loadingMessage,
        },
        this._getTransportsForPublish()
      );
    } catch (e) {
      this.logger.error('Failed to send loading event', e);
    }
  };

  _getAnalyticsMetadata = () => {
    let metadata = {
      expoSdkVersion: this.sdkVersion,
    };

    try {
      metadata = {
        ...metadata,
        webSnackSdkVersion: require('../package.json').version,
      };
    } catch (e) {
      // Probably couldn't require version
    }

    if (typeof window !== 'undefined') {
      metadata = {
        ...metadata,
        webHostname: window.location.hostname,
      };
    }

    if (typeof navigator !== 'undefined') {
      if (!platform) {
        try {
          platform = require('platform');
        } catch (e) {
          // platform has side effects. should be fine but try/catch just to be safe.
        }
      }

      if (platform) {
        const platformInfo = platform.parse(navigator.userAgent);
        const os = platformInfo.os || {};
        metadata = {
          ...metadata,
          webOSArchitecture: os.architecture,
          webOSFamily: os.family,
          webOSVersion: os.version,
          webLayoutEngine: platformInfo.layout,
          webDeviceType: platformInfo.product,
          webBrowser: platformInfo.name,
          webBrowserVersion: platformInfo.version,
          webDescription: platformInfo.description,
        };
      }
    }

    return metadata;
  };

  _publish = debounce(this._publishNotDebouncedAsync, DEBOUNCE_INTERVAL);

  // ARBITRARY NPM MODULES

  _tryFetchDependencyAsync = async (
    name: string,
    version: ?string
  ): Promise<ExpoDependencyResponse> => {
    const bundleName = `${name}${version ? `@${version}` : ''}`;
    for (let i = 0; i < 30; i++) {
      this.logger.module('Resolving dependency', bundleName, '...');

      const url = `${this.snackagerUrl}/bundle/${bundleName}?${
        this.supportsFeature('VERSIONED_SNACKAGER') ? 'version_snackager=true&' : ''
      }platforms=ios,android,web`;

      const res = await fetch(`${url}`);

      if (res.status === 200) {
        const data = await res.json();
        if (data.pending) {
          this.logger.module(
            'Dependency is still being bundled',
            bundleName,
            'trying again shortly'
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else {
          this.logger.module('Resolved dependency', bundleName, data);
          return data;
        }
      } else {
        const error = await res.text();
        this.logger.error('Failed to obtain bundle location', bundleName, error);
        throw new Error(error);
      }
    }

    throw new Error('Request timed out');
  };

  _dependencyPromises: { [id: string]: ?Promise<ExpoDependencyResponse> } = {};

  _maybeFetchDependencyAsync = async (
    name: string,
    version: string
  ): Promise<ExpoDependencyResponse> => {
    const id = `${name}-${version}`;
    const match = /^(?:@([^/?]+)\/)?([^@/?]+)(?:\/([^@]+))?/.exec(name);

    if (!match) {
      return Promise.reject(new Error(`Failed to parse the package name: '${name}'`));
    }

    const fullName = (match[1] ? `@${match[1]}/` : '') + match[2];

    const validPackage = validate(fullName).validForOldPackages;
    const validVersion = version && version !== 'latest' ? semver.validRange(version) : true;
    if (!validPackage || !validVersion) {
      const validationError = !validPackage
        ? new Error(`${fullName} is not a valid package`)
        : new Error(`Invalid version for ${fullName}@${version}`);
      return Promise.reject(validationError);
    }

    const result = this._dependencyPromises[id] || this._tryFetchDependencyAsync(name, version);

    // Cache the promise to avoid sending same request more than once
    this._dependencyPromises[id] = result;

    // Remove the promise from cache if it was rejected
    result.catch(() => (this._dependencyPromises[id] = null));

    return result;
  };

  _addModuleAsync = async (name: string, version: ?string, previous: ExpoDependencyV2) => {
    if (isModulePreloaded(name, this.sdkVersion)) {
      throw new Error(`Module is already preloaded: ${name}`);
    }

    // Check if the dependency is already installed
    const dependency = previous[name];

    if (dependency && (dependency.version === version || dependency.resolved === version)) {
      return previous;
    }

    const versionToInstall = version || getSupportedVersion(name, this.sdkVersion) || 'latest';

    const loadingMessage = `Resolving module: ${name}@${versionToInstall}`;

    this.isResolving = true;
    this.loadingMessage = loadingMessage;
    this._sendLoadingEvent();
    this._sendStateEvent();

    try {
      const result = await this._maybeFetchDependencyAsync(name, versionToInstall);
      const peerDependencies = result.dependencies;

      let dependencies = {
        ...previous,
        [result.name]: {
          version: version || getSupportedVersion(name, this.sdkVersion) || result.version,
          resolved: result.version,
          handle: result.handle,
          peerDependencies: peerDependencies
            ? Object.keys(peerDependencies).reduce((acc, curr) => {
                acc[curr] = {
                  version: peerDependencies[curr],
                };
                return acc;
              }, {})
            : {},
        },
      };

      if (peerDependencies && Object.keys(peerDependencies).length) {
        this.logger.module('Resolving peer dependencies', peerDependencies, '...');

        for (const name of Object.keys(peerDependencies)) {
          // Don't install peer dep if already installed
          // We don't check for version as the version specified in top-level dep takes precedence
          if (isModulePreloaded(name, this.sdkVersion) || dependencies[name]) {
            continue;
          }

          dependencies = await this._addModuleAsync(
            name,
            peerDependencies[name] || 'latest',
            dependencies
          );
        }
      }

      return dependencies;
    } catch (e) {
      this.logger.error('Failed to resolve module', e);

      if (this.dependencyErrorListener) {
        this.dependencyErrorListener(`Error fetching ${name}@${version || 'latest'}: ${e.message}`);
      }

      throw e;
    } finally {
      this.isResolving = false;
      this.loadingMessage = '';
      this._sendLoadingEvent();
      this._sendStateEvent();
    }
  };
}

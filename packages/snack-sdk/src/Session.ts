import mapValues from 'lodash/mapValues';
import nullthrows from 'nullthrows';

import DependencyResolver, {
  DependencyResolverCallback,
  verifyDependency,
  getMissingDependencies,
} from './DependencyResolver';
import DevSession from './DevSession';
import FileUploader, { FileUploaderCallback } from './FileUploader';
import { Logger, createLogger } from './Logger';
import * as State from './State';
import { WantedDependencyVersions, WantedDependencyVersionsCallback } from './WantedVersions';
import defaultConfig, { SnackIdentityState } from './defaultConfig';
import { validateSDKVersion, isModulePreloaded } from './sdk';
import {
  createTransport,
  SnackTransport,
  SnackTransportEvent,
  SnackTransportOptions,
} from './transports';
import {
  ProtocolIncomingMessage,
  ProtocolOutgoingMessage,
  ProtocolConsoleMessage,
  ProtocolErrorMessage,
  ProtocolReloadMessage,
  ProtocolStatusMessage,
  ProtocolRequestStatusMessage,
} from './transports/Protocol';
import { createWebPlayerTransport, getWebPlayerIFrameURL } from './transports/webPlayer';
import {
  SDKVersion,
  SnackDependencies,
  SnackFiles,
  SnackFile,
  SnackState,
  SnackUser,
  SnackSendBeaconRequest,
  SnackLogEvent,
  SnackListenerSubscription,
  SnackDependency,
  SnackConnectedClients,
  SnackWindowRef,
} from './types';
import { createChannel, fetch, createURL, createError } from './utils';

export type SnackOptions = {
  sdkVersion?: SDKVersion;
  name?: string;
  description?: string;
  dependencies?: SnackDependencies;
  files?: SnackFiles;
  apiURL?: string;
  host?: string;
  snackagerURL?: string;
  verbose?: boolean;
  disabled?: boolean;
  online?: boolean;
  channel?: string; // Will be randomly generated if not provided
  deviceId?: string;
  transports?: { [id: string]: SnackTransport };
  createTransport?: (options: SnackTransportOptions) => SnackTransport;
  codeChangesDelay?: number;
  reloadTimeout?: number;
  previewTimeout?: number;
  user?: SnackUser;
  id?: string;
  webPlayerURL?: string;
  webPreviewRef?: SnackWindowRef;
};

export type SnackSaveOptions = {
  isDraft?: boolean;
  ignoreUser?: boolean;
};

export type SnackStateListener = (state: SnackState, prevState: SnackState) => any;
export type SnackLogListener = (log: SnackLogEvent) => any;

export default class Snack {
  private state: SnackState;
  private stateListeners: Set<SnackStateListener> = new Set();
  private logListeners: Set<SnackLogListener> = new Set();
  private readonly createTransport: (options: SnackTransportOptions) => SnackTransport;
  private readonly logger?: Logger;
  private readonly apiURL: string;
  private readonly host: string;
  private readonly dependencyResolver: DependencyResolver;
  private readonly fileUploader: FileUploader;
  private readonly DevSession: DevSession;
  private wantedDependencyVersions: WantedDependencyVersions;
  private codeChangesDelay: number;
  private codeChangesTimer: any;
  private readonly reloadTimeout: number;
  private readonly previewTimeout: number;
  private readonly webPlayerURL: string;
  private pruneConnectionsTimer: any;
  private readonly transportListeners: {
    [key: string]: (event: any) => void;
  } = {};

  constructor(options: SnackOptions) {
    const channel = createChannel(options.channel);
    const sdkVersion = validateSDKVersion(options.sdkVersion ?? defaultConfig.sdkVersion);
    const dependencies = options.dependencies ? { ...options.dependencies } : {};
    this.apiURL = options.apiURL ?? defaultConfig.apiURL;
    this.host = options.host ?? defaultConfig.host;
    this.logger = options.verbose ? createLogger(true) : undefined;
    this.codeChangesDelay = options.codeChangesDelay ?? 0;
    this.reloadTimeout = options.reloadTimeout ?? 0;
    this.previewTimeout = options.previewTimeout ?? 10000;
    this.createTransport = options.createTransport ?? createTransport;
    this.webPlayerURL = options.webPlayerURL ?? defaultConfig.webPlayerURL;

    let transports = options.transports ?? {};
    if (options.online) {
      transports = State.addObject(
        transports,
        'pubnub',
        this.createTransport({
          name: 'pubnub',
          channel,
          verbose: options.verbose,
          apiURL: this.apiURL,
        })
      );
    }
    if (options.webPreviewRef) {
      transports = State.addObject(
        transports,
        'webplayer',
        createWebPlayerTransport({
          ref: options.webPreviewRef,
          verbose: options.verbose,
          createTransport: this.createTransport,
          window: nullthrows(typeof window !== 'undefined' ? window : (global as any)),
          webPlayerURL: this.webPlayerURL,
        })
      );
    }

    this.state = this.updateDerivedState(
      {
        disabled: !!options.disabled,
        unsaved: false,
        name: options.name ?? '',
        description: options.description ?? '',
        sdkVersion,
        files: options.files ?? {},
        dependencies,
        missingDependencies: getMissingDependencies(dependencies, sdkVersion),
        connectedClients: {},
        transports,
        user: options.user,
        id: options.id,
        saveURL: options.id ? createURL(this.host, sdkVersion, undefined, options.id) : undefined,
        savedSDKVersion: options.id ? sdkVersion : undefined,
        online: false,
        url: createURL(this.host, sdkVersion, channel, options.id),
        channel,
        deviceId: options.deviceId,
      },
      SnackIdentityState
    );
    this.state.unsaved = false;

    this.wantedDependencyVersions = new WantedDependencyVersions({
      logger: this.logger,
      callback: this.onWantedDependencyVersions,
    });
    this.dependencyResolver = new DependencyResolver({
      snackagerURL: options.snackagerURL ?? defaultConfig.snackagerURL,
      logger: this.logger,
      callback: this.onDependencyResolved,
    });
    this.fileUploader = new FileUploader({
      apiURL: this.apiURL,
      logger: this.logger,
      callback: this.onFileUploaded,
    });
    this.DevSession = new DevSession({
      apiURL: this.apiURL,
      logger: this.logger,
      onSendBeaconCloseRequest: this.onDevSessionSendBeaconCloseRequest,
    });
    this.logger?.info('Snack created', this.getState());
    this.onStateChanged(this.state, SnackIdentityState);
  }

  //
  // Content
  //

  /**
   * Sets the Expo SDK version.
   * @param sdkVersion Valid SDK version (e.g. "38.0.0")
   */
  setSDKVersion(sdkVersion: SDKVersion) {
    validateSDKVersion(sdkVersion);
    return this.setState((state) =>
      state.sdkVersion !== sdkVersion
        ? {
            sdkVersion,
            missingDependencies: getMissingDependencies(
              state.dependencies,
              sdkVersion,
              state.wantedDependencyVersions
            ),
          }
        : null
    );
  }

  /**
   * Sets the name of the Snack.
   * @param name E.g. "conspicious orange"
   */
  setName(name: string) {
    return this.setState((state) => (state.name !== name ? { name } : null));
  }

  /**
   * Sets the description of the Snack.
   * @param name E.g. "My awesome Snack"
   */
  setDescription(description: string) {
    return this.setState((state) => (state.description !== description ? { description } : null));
  }

  /**
   * Sets the associated user account.
   *
   * When set and `online` is true, causes this Snack to appear on the
   * "Recently in Development" section of all Expo clients that are signed
   * in with that account.
   */
  setUser(user?: SnackUser) {
    return this.setState((state) => (state.user !== user ? { user } : null));
  }

  /**
   * Sets the device-id of an Expo client. When set and `online` is true, causes this
   * Snack to appear on the "Recently in Development" section of that Expo client.
   */
  setDeviceId(deviceId?: string) {
    return this.setState((state) => (state.deviceId !== deviceId ? { deviceId } : null));
  }

  /**
   * Sets the focus to this Snack.
   *
   * Causes this Snack to be moved to the top of the "Recently in Development" list
   * in the Expo client.
   */
  setFocus() {
    this.DevSession.setFocus(this.state);
  }

  /**
   * Sets the delay that is used before sending code updates to the connected clients.
   * Use this method to set the "debounce" timeout to use for sending code changes
   * over pubnub.
   *
   * ```
   *   -1 = Disable automatic sending of code changes (use `sendCodeChanges` to trigger the send)
   *    0 = Code changes are sent immediately to the connected clients
   * 1..n = Code changes are debounced and sent after the wait time
   * ```
   *
   * @param delay Timeout in milliseconds (or -1 to disable automatic code updates)
   */
  setCodeChangesDelay(delay: number) {
    if (this.codeChangesDelay !== delay) {
      this.codeChangesDelay = delay;
      this._sendCodeChangesDebounced(this.state);
    }
  }

  /**
   * Sends any pending code changes to the connected clients.
   * No changes are send if all clients are already up to date.
   */
  sendCodeChanges() {
    this._sendCodeChangesDebounced(this.state, true);
  }

  private _sendCodeChangesDebounced(state: SnackState, immediate?: boolean) {
    // Clear the debounce timer
    if (this.codeChangesTimer) {
      clearTimeout(this.codeChangesTimer);
      this.codeChangesTimer = undefined;
    }

    // Schedule debounced update
    if (!immediate && this.codeChangesDelay > 0) {
      this.codeChangesTimer = setTimeout(
        () => this._sendCodeChangesDebounced(state, true),
        this.codeChangesDelay
      );
      return;
    } else if (!immediate && this.codeChangesDelay < 0) {
      return;
    }

    // Send the changes
    const { transports, files, dependencies, sdkVersion } = state;
    for (const key in transports) {
      transports[key].postMessage({
        type: 'update_code',
        data: {
          files,
          dependencies,
          sdkVersion,
        },
      });
    }
  }

  //
  // Save
  //

  /**
   * Uploads the current code to Expo's servers and return a url that points to that version of the code.
   */
  async saveAsync(options?: SnackSaveOptions) {
    const prevState = this.state;
    const { name, description, sdkVersion, files, dependencies, user } = this.state;

    // Wait for any pending asset uploads the complete before saving
    await this.fileUploader.waitForCompletion();

    try {
      const payload: any = {
        manifest: {
          sdkVersion,
          name,
          description,
          dependencies: mapValues(dependencies, (dep) => dep.version),
        },
        code: mapValues(files, (file: any) => {
          file = { ...file };
          delete file.error;
          return file;
        }),
        dependencies: mapValues(dependencies, (dep) => {
          dep = { ...dep };
          delete dep.error;
          return dep;
        }),
        isDraft: options?.isDraft ?? false,
      };

      this.logger?.info('Saving...', payload);

      const previewPromise = this.getPreviewAsync();

      const url = `${this.apiURL}/--/api/v2/snack/save`;
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          ...(user?.sessionSecret && !options?.ignoreUser
            ? { 'Expo-Session': user.sessionSecret }
            : {}),
        },
      });
      const data = await response.json();
      if (!data?.id) {
        throw new Error(data.errors?.[0]?.message || 'Failed to save');
      }

      this.logger?.info('Saved', data);

      const id: string = data.id;
      const saveURL = createURL(this.host, sdkVersion, undefined, id);
      const hashId: string | undefined = data.hashId;

      this.setState((state) => ({
        id,
        saveURL,
        unsaved: State.isUnsaved(state, prevState),
        savedSDKVersion:
          options?.isDraft && state.savedSDKVersion ? state.savedSDKVersion : sdkVersion,
      }));

      previewPromise.then((connectedClients) => {
        const conns = Object.values(connectedClients)
          .filter((c) => c.previewURL)
          .sort((a, b) => (a.previewTimestamp ?? 0) - (b.previewTimestamp ?? 0));
        if (conns.length) {
          this.uploadPreview(id, conns[0].previewURL as string, conns[0].status !== 'error');
        }
      });

      return {
        id,
        url: saveURL,
        hashId,
      };
    } catch (e) {
      this.logger?.error(e);
      throw e;
    }
  }

  /**
   * Gets the URL at which the Snack can be downloaded as a zip file. Will automatically
   * save the Snack if it contains unsaved changes.
   */
  async getDownloadURLAsync(saveOptions?: SnackSaveOptions) {
    await this.fileUploader.waitForCompletion();
    let state = this.getState();
    if (!state.id || state.unsaved) {
      await this.saveAsync(saveOptions);
      state = this.getState();
    }
    return `${this.apiURL}/--/api/v2/snack/download/${state.id}`;
  }

  private async uploadPreview(id: string, previewURL: string, status: boolean) {
    const url = `${this.apiURL}/--/api/v2/snack/updateMetadata`;
    const payload = {
      id,
      previewLocation: previewURL,
      status: status ? 'SUCCESS' : 'FAILURE',
    };
    this.logger?.info('Uploading preview...', payload);

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
        this.logger?.info('Uploaded preview', data);
      } else {
        throw new Error(data.errors?.[0]?.message ?? 'Unknown error');
      }
    } catch (e) {
      this.logger?.error('Failed to upload preview', e);
    }
  }

  //
  // State
  //

  /**
   * Returns the current state of the Snack. This includes files, dependencies
   * and other meta-data about the Snack.
   */
  getState(): SnackState {
    return this.state;
  }

  /**
   * Waits for any pending operations such as running dependencies resolutions
   * before returning the state.
   */
  async getStateAsync() {
    await this.wantedDependencyVersions.waitForCompletion();
    await this.dependencyResolver.waitForCompletion();
    await this.fileUploader.waitForCompletion();
    return this.getState();
  }

  /**
   * Adds a callback for listening for any state changes.
   *
   * @example
   * ```
   * const unsubscribe = Snack.addStateListener((state, prevState) => {
   *   if (state.name !== prevState.name) {
   *     console.log('name changed: ', state.name);
   *   }
   * });
   *
   * Snack.setName('unforgiven orange'); // // Make a change to the state
   *
   * unsubscribe(); // Remove listener
   * ```
   */
  addStateListener(listener: SnackStateListener): SnackListenerSubscription {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private setState(stateFn: (state: SnackState) => any) {
    const update = stateFn(this.state);
    if (update) {
      const oldState = this.state;
      const newState: SnackState = {
        ...oldState,
        ...update,
      };
      this.state = this.updateDerivedState(newState, oldState);
      this.onStateChanged(newState, oldState);
      this.stateListeners.forEach((listener) => listener(newState, oldState));
    }
  }

  private updateDerivedState(state: SnackState, prevState: SnackState): SnackState {
    // Set unsaved to true whenever files or dependencies change
    state.unsaved = state.unsaved || State.isUnsaved(state, prevState);

    // Update other derived states
    this.updateDerivedOnlineState(state, prevState);
    this.updateDerivedDependenciesState(state, prevState);
    this.updateDerivedWebPreviewState(state, prevState);

    return state;
  }

  private onStateChanged(state: SnackState, prevState: SnackState) {
    this.updateWantedDependencyVersions(state, prevState);
    this.updateDependencyResolver(state, prevState);
    this.updateFileUploader(state, prevState);
    this.updateTransports(state, prevState);
    this.DevSession.setState(state, prevState);
  }

  //
  // Files (code & assets)
  //

  /**
   * Updates code or asset files.
   *
   * Use this method to add/remove/update files and upload assets.
   * To remove a file specify `null` as the value of the file.
   *
   * @example
   * ```ts
   * const Snack = new Snack({
   *   files: {
   *     'App.js': { type: 'CODE', contents: 'console.log("hello world!");' },
   *     'data.json': { type: 'CODE', contents: '{}' },
   *   }
   * });
   *
   * // Add or update files
   * Snack.updateFiles({
   *   'App.js': {
   *     type: 'CODE',
   *     contents: 'console.log("Hello Snack!");'
   *   }
   * });
   *
   * // Upload an asset
   * Snack.updateFiles({
   *   'assets/logo.png': {
   *     type: 'ASSET',
   *     contents: file // File, Blob or FormData
   *   }
   * });
   *
   * // Add a pre-uploaded asset
   * Snack.updateFiles({
   *   'assets/expo.jpg': {
   *     type: 'ASSET',
   *     contents: 'https://mysite/expo.jpg'
   *   }
   * });
   *
   * // Remove files
   * Snack.updateFiles({
   *   'data.json': null,
   *   'assets/expo.jpg': null
   * });
   * ```
   */
  updateFiles(files: { [path: string]: SnackFile | null }) {
    return this.setState((state) => {
      const newFiles = State.updateObjects(state.files, files);
      return newFiles !== state.files ? { files: newFiles } : null;
    });
  }

  /**
   * Helper function that uploads an asset and returns its url.
   */
  uploadAssetAsync = async (contents: File | Blob | FormData): Promise<string> => {
    let url: string = '';
    const fileUploader = new FileUploader({
      apiURL: this.apiURL,
      logger: this.logger,
      callback: (_request, resultURL, error) => {
        if (error) {
          throw error;
        } else if (resultURL) {
          url = resultURL;
        }
      },
    });
    fileUploader.add('asset', {
      type: 'ASSET',
      contents,
    });
    await fileUploader.waitForCompletion();
    return url;
  };

  private updateFileUploader(state: SnackState, prevState: SnackState) {
    const files = state.files;
    const prevFiles = prevState.files;

    // Stop uploading any removed or changed assets
    if (!prevState.disabled && ((!state.disabled && files !== prevFiles) || state.disabled)) {
      for (const path in prevFiles) {
        if (!files[path] || files[path].contents !== prevFiles[path].contents || state.disabled) {
          this.fileUploader.remove(path, prevFiles[path]);
        }
      }
    }

    // Start uploading any new or changed assets, or when the error is cleared
    if (!state.disabled && (files !== prevFiles || prevState.disabled)) {
      for (const path in files) {
        const file = files[path];
        if (
          file.type === 'ASSET' &&
          typeof file.contents === 'object' &&
          !file.error &&
          (prevFiles[path]?.contents !== file.contents || prevState.disabled)
        ) {
          this.fileUploader.add(path, file);
        }
      }
    }
  }

  private onFileUploaded: FileUploaderCallback = (request, resultURL, error) => {
    // When a file has been uploaded, store its url in the state. This state should be persisted
    // by the client so that the next time it doesn't need to be uploaded again.
    this.setState(({ files }) => ({
      files: State.addObject(files, request.path, {
        ...request.file,
        ...(resultURL ? { contents: resultURL } : {}),
        ...(error ? { error } : {}),
      }),
    }));
  };

  //
  // Dependencies
  //

  /**
   * Updates dependencies.
   *
   * Use this method to add/remove/update dependencies.
   * To remove a dependency specify `null` as the value of the key/value pair.
   *
   * @example
   * ```ts
   * const Snack = new Snack({
   *   dependencies: {
   *     'react-native-paper': '~2.0.0'
   *   }
   * });
   *
   * // Add dependency
   * Snack.updateDependencies({
   *   'expo-font': '9.0.0'
   * });
   *
   * // Remove dependency
   * Snack.updateDependencies({
   *   'expo-font': null
   * });
   * ```
   */
  updateDependencies(dependencies: { [name: string]: SnackDependency | null }) {
    return this.setState((state) => {
      const newDependencies = State.updateObjects(state.dependencies, dependencies);
      return newDependencies !== state.dependencies
        ? {
            dependencies: newDependencies,
            missingDependencies: getMissingDependencies(
              newDependencies,
              state.sdkVersion,
              state.wantedDependencyVersions
            ),
          }
        : null;
    });
  }

  private updateDerivedDependenciesState(state: SnackState, prevState: SnackState) {
    if (
      state.wantedDependencyVersions !== prevState.wantedDependencyVersions ||
      state.dependencies !== prevState.dependencies
    ) {
      for (const name in state.dependencies) {
        const dep = state.dependencies[name];
        const wantedVersion = state.wantedDependencyVersions?.[name] ?? undefined;
        if (dep.wantedVersion !== wantedVersion) {
          state.dependencies =
            state.dependencies === prevState.dependencies
              ? { ...state.dependencies }
              : state.dependencies;
          const version =
            (dep.version === '*' || (dep.wantedVersion && dep.version === dep.wantedVersion)) &&
            wantedVersion
              ? wantedVersion
              : dep.version;
          state.dependencies[name] = {
            ...dep,
            version,
            wantedVersion,
          };
          if (dep.handle && dep.version !== version) {
            delete state.dependencies[name].handle;
          }
        }
      }
    }

    if (state.dependencies !== prevState.dependencies) {
      for (const name in state.dependencies) {
        const dep = state.dependencies[name];
        if (dep !== prevState.dependencies[name]) {
          const error = verifyDependency(name, dep.version);
          if (error) {
            state.dependencies[name] = {
              ...dep,
              error,
            };
          }
        }
      }
    }
  }

  private updateWantedDependencyVersions(state: SnackState, _prevState: SnackState) {
    if (!state.disabled && Object.keys(state.dependencies).length) {
      this.wantedDependencyVersions.setSDKVersion(state.sdkVersion);
    }
  }

  private onWantedDependencyVersions: WantedDependencyVersionsCallback = (
    _sdkVersion,
    result,
    error
  ) => {
    const wantedDependencyVersions = error ? {} : result;
    this.setState(({ dependencies, sdkVersion }) => ({
      wantedDependencyVersions,
      missingDependencies: getMissingDependencies(
        dependencies,
        sdkVersion,
        wantedDependencyVersions
      ),
    }));
  };

  private updateDependencyResolver(state: SnackState, prevState: SnackState) {
    const dependencies = state.dependencies;
    const prevDependencies = prevState.dependencies;

    // Stop resolving any removed or changed dependencies
    if (
      !prevState.disabled &&
      (dependencies !== prevDependencies ||
        state.disabled ||
        state.sdkVersion !== prevState.sdkVersion)
    ) {
      for (const name in prevDependencies) {
        if (
          !dependencies[name] ||
          dependencies[name].version !== prevDependencies[name].version ||
          state.disabled ||
          (isModulePreloaded(name, state.sdkVersion) &&
            !isModulePreloaded(name, prevState.sdkVersion))
        ) {
          this.dependencyResolver.remove(
            name,
            prevDependencies[name].version,
            prevState.sdkVersion
          );
        }
      }
    }

    // Add any still unresolved dependencies to the dependency resolver
    if (
      !state.disabled &&
      (dependencies !== prevDependencies ||
        prevState.disabled ||
        state.sdkVersion !== prevState.sdkVersion ||
        state.wantedDependencyVersions !== prevState.wantedDependencyVersions)
    ) {
      for (const name in dependencies) {
        const dependency = dependencies[name];
        if (
          !dependency.handle &&
          !dependency.error &&
          !isModulePreloaded(name, state.sdkVersion) &&
          !(dependency.version === '*' && !state.wantedDependencyVersions) &&
          (prevDependencies[name]?.version !== dependency.version ||
            (dependency.version === '*' && !prevState.wantedDependencyVersions) ||
            prevDependencies[name]?.handle ||
            prevDependencies[name]?.error ||
            prevState.disabled)
        ) {
          this.dependencyResolver.add(name, dependency.version, state.sdkVersion);
        }
      }
    }
  }

  private onDependencyResolved: DependencyResolverCallback = (request, result, error) => {
    // When a dependency is resolved, store its handle and peer-dependencies
    // in the state. This state should be persisted by the client so that the next
    // time it doesn't need to be resolved again.
    this.setState(({ dependencies, sdkVersion, wantedDependencyVersions }) => {
      const newDependencies = State.addObject(dependencies, request.name, {
        ...dependencies[request.name],
        version: request.version,
        ...(result
          ? {
              handle: result.handle,
              peerDependencies: result.dependencies,
            }
          : {}),
        ...(error ? { error } : {}),
      });
      return newDependencies !== dependencies
        ? {
            dependencies: newDependencies,
            missingDependencies: getMissingDependencies(
              newDependencies,
              sdkVersion,
              wantedDependencyVersions
            ),
          }
        : null;
    });
  };

  //
  // Online
  //

  /**
   * Enables or disables the Snack.
   *
   * When disabled, no uploads or dependency resolve operations
   * are performed.
   */
  setDisabled(disabled: boolean) {
    return this.setState((state) => (disabled !== state.disabled ? { disabled } : null));
  }

  /**
   * Makes the Snack available online.
   *
   * When online, a pubnub channel is created to which clients can
   * connect.
   */
  setOnline(enabled: boolean) {
    return this.setState((state) => {
      if (enabled && !state.transports['pubnub']) {
        return {
          transports: State.addObject(
            state.transports,
            'pubnub',
            this.createTransport({
              name: 'pubnub',
              apiURL: this.apiURL,
              channel: state.channel,
              verbose: !!this.logger,
            })
          ),
        };
      } else if (!enabled && state.transports['pubnub']) {
        let connectedClients = state.connectedClients;
        for (const key in state.connectedClients) {
          if (state.connectedClients[key].transport === 'pubnub') {
            connectedClients = State.removeObject(connectedClients, key);
          }
        }
        return {
          transports: State.removeObject(state.transports, 'pubnub'),
          connectedClients,
        };
      } else {
        return null;
      }
    });
  }

  private updateDerivedOnlineState(state: SnackState, prevState: SnackState) {
    const { transports, sdkVersion, channel, id, name, disabled, savedSDKVersion } = state;
    if (
      transports !== prevState.transports ||
      sdkVersion !== prevState.sdkVersion ||
      channel !== prevState.channel ||
      id !== prevState.id ||
      name !== prevState.name ||
      savedSDKVersion !== prevState.savedSDKVersion
    ) {
      state.online = !!transports['pubnub'] && !disabled;
      state.url = createURL(
        this.host,
        sdkVersion,
        channel,
        savedSDKVersion && savedSDKVersion !== sdkVersion ? undefined : id
      );
      state.onlineName = `${name || 'Unnamed Snack'}`;
    }
  }

  private updateDerivedWebPreviewState(state: SnackState, prevState: SnackState) {
    const { transports, sdkVersion, url } = state;
    if ((url && !prevState.url) || sdkVersion !== prevState.sdkVersion) {
      state.webPreviewURL = transports['webplayer']
        ? getWebPlayerIFrameURL(this.webPlayerURL, sdkVersion, url, !!this.logger)
        : undefined;
    }
  }

  private onDevSessionSendBeaconCloseRequest = (sendBeaconCloseRequest: SnackSendBeaconRequest) => {
    this.setState((_state) => ({
      sendBeaconCloseRequest,
    }));
  };

  //
  // Transports
  //

  /**
   * Reloads all connected clients.
   *
   * Note: During the reload proces, clients may get disconnected which
   * causes the connectedClient to disappear and re-appear. The `reloadTimeout`
   * option in the constructor can be used to keep connectedClients "alive"
   * during the reload process.
   */
  reloadConnectedClients() {
    const connectedTransports = new Set<SnackTransport>();
    this.setState((state) => {
      let { connectedClients } = state;
      for (const key in state.connectedClients) {
        const connectedClient = state.connectedClients[key];
        connectedTransports.add(state.transports[connectedClient.transport]);
        connectedClients = State.addObject(connectedClients, key, {
          ...connectedClient,
          status: 'reloading',
        });
      }
      return connectedClients !== state.connectedClients ? { connectedClients } : null;
    });
    const reloadMessage: ProtocolReloadMessage = {
      type: 'RELOAD_SNACK',
    };
    if (connectedTransports.size) {
      this.logger?.comm('Reloading...');
      connectedTransports.forEach((transport) => {
        transport.postMessage({
          type: 'protocol_message',
          data: reloadMessage,
        });
      });
    }
  }

  /**
   * Requests a preview from the connected clients.
   *
   * The previews are returned in the `previewURL` field of each connectedClient.
   */
  getPreviewAsync(): Promise<SnackConnectedClients> {
    const { connectedClients, transports } = this.state;
    const connectedTransports = new Set<SnackTransport>();
    Object.values(connectedClients).forEach(({ transport }) =>
      connectedTransports.add(transports[transport])
    );
    if (!connectedTransports.size) {
      return Promise.resolve(connectedClients);
    }

    // Send status request to all transports that have
    // active connectedClients.
    const requestStatusMessage: ProtocolRequestStatusMessage = {
      type: 'REQUEST_STATUS',
    };
    if (connectedTransports.size) {
      this.logger?.comm('Requesting preview...');
      connectedTransports.forEach((transport) => {
        transport.postMessage({
          type: 'protocol_message',
          data: requestStatusMessage,
        });
      });
    }

    // Wait for all status-reports to be received and
    // return the connectedClients state when done.
    // Or timeout when it takes too long...
    return new Promise<SnackConnectedClients>((resolve, reject) => {
      let timeoutTimer: any;
      const completedConnections = new Set<string>();
      const unsubscribe = this.addStateListener((state, prevState) => {
        if (state.connectedClients !== prevState.connectedClients) {
          for (const key in connectedClients) {
            if (
              connectedClients[key].previewTimestamp !==
                state.connectedClients[key]?.previewTimestamp ||
              !state.connectedClients[key]
            ) {
              completedConnections.add(key);
              if (completedConnections.size === Object.values(connectedClients).length) {
                unsubscribe();
                clearTimeout(timeoutTimer);
                resolve(state.connectedClients);
                return;
              }
            }
          }
        }
      });

      timeoutTimer = setTimeout(() => {
        unsubscribe();
        reject(new Error('Operation timed out'));
      }, this.previewTimeout);
    });
  }

  private updateTransports(state: SnackState, prevState: SnackState) {
    const transports = state.transports;
    const prevTransports = prevState.transports;

    // Stop any any removed transports
    if (!prevState.disabled && (transports !== prevTransports || state.disabled)) {
      for (const id in prevTransports) {
        if (
          this.transportListeners[id] &&
          (transports[id] !== prevTransports[id] || state.disabled)
        ) {
          prevTransports[id].removeEventListener('message', this.transportListeners[id]);
          delete this.transportListeners[id];
          prevTransports[id].postMessage({ type: 'stop' });
        }
      }
    }

    // Start any added transports
    if (!state.disabled && (transports !== prevTransports || prevState.disabled)) {
      for (const id in transports) {
        if (
          !this.transportListeners[id] &&
          (transports[id] !== prevTransports[id] || prevState.disabled)
        ) {
          this.transportListeners[id] = (event: any) => this.onTransportEvent(id, event);
          transports[id].addEventListener('message', this.transportListeners[id]);
          transports[id].postMessage({ type: 'start' });
        }
      }
    }

    // Update the code
    if (
      !state.disabled &&
      !State.isBusy(state) &&
      (transports !== prevTransports || State.isCodeChanged(state, prevState) || prevState.disabled)
    ) {
      this._sendCodeChangesDebounced(
        state,
        prevTransports !== transports || (!State.isBusy(state) && State.isBusy(prevState))
      );
    }
  }

  private onTransportEvent = (transport: string, event: SnackTransportEvent) => {
    const { type, data } = event;
    // @ts-ignore
    const { connectionId } = event;
    switch (type) {
      case 'connect':
        this.logger?.comm(`Client connected (${transport})`, connectionId);
        this.onClientConnected(transport, connectionId, data);
        break;
      case 'disconnect':
        this.logger?.comm(`Client disconnected (${transport})`, connectionId, data);
        this.onClientDisconnected(transport, connectionId, data);
        break;
      case 'protocol_message':
        this.logger?.comm_recv(`Message received (${transport})`, connectionId, data);
        this.onProtocolMessageReceived(transport, connectionId, event.data);
        break;
      case 'send_message':
        this.onProtocolMessageSent(transport, event.data);
        break;
    }
  };

  private onClientConnected(transport: string, connectedClientId: string, data: any) {
    this.setState((state) => {
      return {
        connectedClients: State.addObject(state.connectedClients, connectedClientId, {
          transport,
          id: data.id,
          name: data.name,
          platform: data.platform,
          status: 'ok',
        }),
      };
    });
  }

  private onClientDisconnected(_transport: string, connectedClientId: string, _data: any) {
    this.setState((state) => {
      const connectedClient = state.connectedClients[connectedClientId];

      // When the connectedClient is reloading, schedule a cleanup
      // in case the connectedClient does not return
      if (connectedClient?.status === 'reloading' && this.reloadTimeout >= 0) {
        if (this.pruneConnectionsTimer) {
          clearTimeout(this.pruneConnectionsTimer);
          this.pruneConnectionsTimer = undefined;
        }
        this.pruneConnectionsTimer = setTimeout(() => {
          this.pruneConnectionsTimer = undefined;
          this.setState((state) => {
            let connectedClients = state.connectedClients;
            for (const key in state.connectedClients) {
              if (state.connectedClients[key].status === 'reloading') {
                connectedClients = State.removeObject(connectedClients, key);
              }
            }
            return connectedClients !== state.connectedClients ? { connectedClients } : null;
          });
        }, this.reloadTimeout);
        return null;
      } else {
        // Otherwise, remove the connectedClient immediately
        const connectedClients = State.removeObject(state.connectedClients, connectedClientId);
        return connectedClients !== state.connectedClients ? { connectedClients } : null;
      }
    });
  }

  //
  // Messaging
  //

  /**
   * Adds a callback for listening for any client generated log messages.
   *
   * @example
   * ```
   * const unsubscribe = Snack.addLogListener((log) => {
   *   console.log('log message received: ', log);
   * });
   *
   * unsubscribe(); // Remove listener
   * ```
   */
  addLogListener(listener: SnackLogListener): SnackListenerSubscription {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  private onProtocolMessageReceived(
    transport: string,
    connectedClientId: string,
    message: ProtocolIncomingMessage
  ) {
    switch (message.type) {
      case 'CONSOLE':
        this.onConsoleMessageReceived(connectedClientId, message);
        break;
      case 'ERROR':
        this.onErrorMessageReceived(connectedClientId, message);
        break;
      case 'STATUS_REPORT':
        this.onStatusReportMessageReceived(connectedClientId, message);
        break;
      // @ts-ignore: CODE is echoed by pubnub, we ignore it
      case 'CODE':
        break;
      // @ts-ignore: RELOAD_SNACK is echoed by pubnub, we ignore it
      case 'RELOAD_SNACK':
        break;
      // @ts-ignore: REQUEST_STATUS is echoed by pubnub, we ignore it
      case 'REQUEST_STATUS':
        break;
      default:
        this.logger?.error('Invalid message received', transport, message);
        break;
    }
  }

  private onProtocolMessageSent(transport: string, message: ProtocolOutgoingMessage) {
    switch (message.type) {
      case 'CODE':
        this.setState((state) => {
          let { connectedClients } = state;
          for (const connectedClientId in connectedClients) {
            const connectedClient = connectedClients[connectedClientId];
            if (connectedClient.transport === transport) {
              connectedClients = State.addObject(connectedClients, connectedClientId, {
                ...connectedClient,
                error: undefined,
                status: connectedClient.status === 'error' ? 'ok' : connectedClient.status,
              });
            }
          }
          return connectedClients !== state.connectedClients ? { connectedClients } : null;
        });
        break;
    }
  }

  private onConsoleMessageReceived(connectedClientId: string, message: ProtocolConsoleMessage) {
    const payload = message.payload || [];

    const event: SnackLogEvent = {
      type: message.method,
      connectedClient: this.state.connectedClients[connectedClientId],
      message: payload.join(' '),
      // error?
      // arguments: payload,
    };

    this.logListeners.forEach((listener) => listener(event));
  }

  private onErrorMessageReceived(connectedClientId: string, message: ProtocolErrorMessage) {
    try {
      const json = JSON.parse(message.error);
      const error = createError({
        name: json.name || 'Error',
        message: json.message || '',
        fileName: json.fileName,
        lineNumber: json.lineNumber || json.loc?.line || json.line,
        columnNumber: json.columnNumber || json.loc?.column || json.column,
        stack: json.stack,
      });
      this.setState((state) => ({
        connectedClients: State.addObject(state.connectedClients, connectedClientId, {
          ...state.connectedClients[connectedClientId],
          error,
          status: 'error',
        }),
      }));
    } catch (e) {
      this.logger?.error('Failed to parse received error message', message);
    }
  }

  private onStatusReportMessageReceived(connectedClientId: string, message: ProtocolStatusMessage) {
    const { previewLocation } = message;
    this.setState((state) => ({
      connectedClients: State.addObject(state.connectedClients, connectedClientId, {
        ...state.connectedClients[connectedClientId],
        previewURL: previewLocation,
        previewTimestamp: Date.now(),
      }),
    }));
  }
}

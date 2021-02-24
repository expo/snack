import { StyleSheet, css } from 'aphrodite';
import BroadcastChannel from 'broadcast-channel';
import debounce from 'lodash/debounce';
import nullthrows from 'nullthrows';
import Raven from 'raven-js';
import * as React from 'react';
import { connect } from 'react-redux';
import { Snack, SnackLogEvent, SnackListenerSubscription, isModulePreloaded } from 'snack-sdk';

import withAuth, { AuthProps } from '../auth/withAuth';
import { DEFAULT_DESCRIPTION, DEFAULT_CODE, DEFAULT_DEPENDENCIES } from '../configs/defaults';
import { versions, DEFAULT_SDK_VERSION } from '../configs/sdk';
import {
  SavedSnack,
  QueryParams,
  SaveStatus,
  SaveHistory,
  SaveOptions,
  SDKVersion,
  Device,
  DeviceLog,
  Platform,
  SnackState,
  SnackFile,
  SnackFiles,
  SnackDependencies,
  SnackDependency,
  SnackDefaults,
  Annotation,
} from '../types';
import Analytics from '../utils/Analytics';
import * as PlatformOptions from '../utils/PlatformOptions';
import { PlatformOption } from '../utils/PlatformOptions';
import { isMobile } from '../utils/detectPlatform';
import getDependenciesFromQuery from '../utils/getDependenciesFromQuery';
import getFilesFromQuery from '../utils/getFilesFromQuery';
import { createSnackWorkerTransport } from '../utils/snackTransports';
import AppDetails from './AppDetails';
import { EditorViewProps } from './EditorViewProps';
import withPreferences, { PreferencesContextType } from './Preferences/withPreferences';
import AppShell from './Shell/AppShell';
import EmbeddedShell from './Shell/EmbeddedShell';
import AnimatedLogo from './shared/AnimatedLogo';
import LazyLoad from './shared/LazyLoad';

const DEVICE_ID_KEY = '__SNACK_DEVICE_ID';

const BROADCAST_CHANNEL_NAME = 'SNACK_BROADCAST_CHANNEL';

type Params = {
  id?: string;
  username?: string;
  projectName?: string;
};

type Props = AuthProps &
  PreferencesContextType & {
    snack?: SavedSnack;
    history: {
      push: (props: { pathname: string; search: string }) => void;
    };
    match: {
      params: Params;
    };
    location: {
      search: string;
    };
    query: QueryParams;
    userAgent: string;
    isEmbedded?: boolean;
    files: SnackFiles;
    defaults: SnackDefaults;
  };

type State = {
  session: SnackState;
  selectedFile: string;
  sendCodeOnChangeEnabled: boolean;
  autosaveEnabled: boolean;
  isSavedOnce: boolean;
  saveHistory: SaveHistory;
  saveStatus: SaveStatus;
  connectedDevices: Device[];
  deviceLogs: DeviceLog[];
  isPreview: boolean;
  wasUpgraded: boolean;
  initialSdkVersion: SDKVersion;
  isDownloading: boolean;
  devicePreviewShown: boolean;
  devicePreviewPlatform: Platform;
  devicePreviewPlatformOptions: PlatformOption[];
  webPreviewURL: string;
  verbose: boolean;
  annotations: Annotation[];
  snackagerURL: string;
};

function getDeviceId(): string | undefined {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(DEVICE_ID_KEY) ?? undefined;
    }
  } catch (e) {
    // Ignore error
  }
  return undefined;
}

class Main extends React.Component<Props, State> {
  _previewRef = React.createRef<Window>();
  private edited: boolean = false;

  constructor(props: Props) {
    super(props);

    let name = props.defaults.name;
    let description = DEFAULT_DESCRIPTION;
    let sdkVersion: SDKVersion = DEFAULT_SDK_VERSION;
    let code: SnackFiles | string = props.files;
    let dependencies =
      props.files === DEFAULT_CODE && !props.snack?.code ? DEFAULT_DEPENDENCIES : {};

    if (props.snack) {
      code = props.snack.code ?? code;
      dependencies = props.snack.dependencies ?? dependencies;
      if (props.snack.manifest) {
        const { manifest } = props.snack;
        name = manifest.name;
        description = manifest.description;
        sdkVersion = manifest.sdkVersion ?? sdkVersion;
      }
    }

    if (props.query) {
      name = props.query.name ?? name;
      description = props.query.description ?? description;
      // Allow specifying "latest" in the query to override the Snack SDK version
      sdkVersion =
        // @ts-ignore: "latest" is not defined in SDKVersion
        props.query.sdkVersion === 'latest'
          ? DEFAULT_SDK_VERSION
          : props.query.sdkVersion ?? sdkVersion;
    }

    const initialSdkVersion = sdkVersion;

    let wasUpgraded = false;

    if (!versions.hasOwnProperty(sdkVersion)) {
      sdkVersion = DEFAULT_SDK_VERSION;
      wasUpgraded = true;
    }

    if (props.query.dependencies?.length) {
      dependencies = getDependenciesFromQuery(props.query.dependencies, sdkVersion);
    }

    let files: SnackFiles =
      typeof code === 'string'
        ? {
            'App.js': { contents: code, type: 'CODE' },
          }
        : (code as any);

    if (typeof window !== 'undefined') {
      const { __snack_embedded_session: embeddedSession } = window;
      if (embeddedSession?.files) {
        name = embeddedSession.name ?? name;
        description = embeddedSession.description ?? description;
        files = embeddedSession.files;
        dependencies = embeddedSession.dependencies ?? dependencies;
        sdkVersion = embeddedSession.sdkVersion ?? sdkVersion;
      }
    }

    const isPreview = !!(
      isMobile(props.userAgent) &&
      (props.match.params.id || props.match.params.projectName) &&
      !props.isEmbedded
    );

    const id =
      !props.match.params.id && props.match.params.username && props.match.params.projectName
        ? `@${props.match.params.username}/${props.match.params.projectName}`
        : props.match.params.id && !wasUpgraded
        ? props.match.params.id
        : undefined;

    const verbose = props.query.verbose === 'true';
    const isWorker = true;
    const sendCodeOnChangeEnabled = true;
    const sessionSecret = props.getSessionSecret();
    const snackagerURL = nullthrows(process.env.IMPORT_SERVER_URL);

    this._snack = new Snack({
      disabled: true,
      channel: props.defaults.channel,
      name,
      description,
      files,
      dependencies,
      sdkVersion,
      verbose,
      codeChangesDelay: sendCodeOnChangeEnabled ? 1000 : -1,
      createTransport: isWorker ? createSnackWorkerTransport : undefined,
      reloadTimeout: 10000,
      deviceId: getDeviceId(),
      id: !wasUpgraded ? id : undefined,
      user: sessionSecret ? { sessionSecret } : undefined,
      apiURL: nullthrows(process.env.API_SERVER_URL),
      snackagerURL,
      host:
        // Use staging server in development, otherwise Expo Go and appetize
        // can't access the runtime. Replace with ngrok url to test locally.
        process.env.NODE_ENV === 'development'
          ? 'staging.snack.expo.io'
          : new URL(nullthrows(process.env.SERVER_URL)).host,
      webPreviewRef: typeof window !== 'undefined' ? this._previewRef : undefined,
      // Serve local web-player through `/web-player` end-point to prevent CORS issues
      webPlayerURL:
        typeof window !== 'undefined' &&
        nullthrows(process.env.SNACK_WEBPLAYER_URL).startsWith('http://localhost:')
          ? `${window.location.origin}/web-player/%%SDK_VERSION%%`
          : nullthrows(process.env.SNACK_WEBPLAYER_URL) + '/v2/%%SDK_VERSION%%',
    });

    const devicePreviewPlatformOptions = PlatformOptions.filter({
      sdkVersion,
      supportedPlatformsQueryParam: props.query.supportedPlatforms,
    });
    const devicePreviewShown = props.query.preview
      ? props.query.preview !== 'false'
      : props.isEmbedded
      ? false
      : props.preferences.devicePreviewShown;
    const devicePreviewPlatform = PlatformOptions.getSelectedPlatform({
      options: devicePreviewPlatformOptions,
      sdkVersion,
      requestedPlatform:
        (props.query.platform ??
          (props.isEmbedded ? 'web' : props.preferences.devicePreviewPlatform)) ||
        'web',
    });

    const selectedFile = files['App.js']
      ? 'App.js'
      : files['App.tsx']
      ? 'App.tsx'
      : files['app.js']
      ? 'app.js'
      : Object.keys(files).length
      ? Object.keys(files)[0]
      : '';

    this.state = {
      session: this._snack.getState(),
      selectedFile,
      sendCodeOnChangeEnabled,
      // We don't have any UI for autosave in embed
      // In addition, enabling autosave in embed will disable autosave in editor when embed dialog is open
      autosaveEnabled: !props.isEmbedded,
      isSavedOnce: false,
      saveHistory: props.snack?.history ?? [],
      saveStatus: props.snack?.isDraft ? 'saved-draft' : id ? 'published' : 'unsaved',
      connectedDevices: [],
      deviceLogs: [],
      isPreview,
      wasUpgraded,
      initialSdkVersion,
      isDownloading: false,
      devicePreviewShown,
      devicePreviewPlatform,
      devicePreviewPlatformOptions,
      verbose,
      annotations: [],
      snackagerURL,
      webPreviewURL: '',
    };
  }

  static getDerivedStateFromProps(_props: Props, state: State) {
    if (typeof window !== 'undefined') {
      let webPreviewURL = state.session.webPreviewURL;

      // Starting from SDK 40, the web-player URL is served from a static domain.
      // For lower SDK versions we fallback to the legacy URL which is served by
      // the Snack `/web-player/..` end-point.
      // TODO: Remove this one SDK 39 has been deprecated
      if (state.session.sdkVersion <= '39.0.0') {
        webPreviewURL = `${window.location.origin}/web-player/${
          state.session.sdkVersion.split('.')[0]
        }/index.html?initialUrl=${encodeURIComponent(state.session.url)}`;
      }

      if (state.webPreviewURL !== webPreviewURL) {
        // Dirty hack to update the origin that the transport uses to communicate
        // with the web-player. The transport origin is initialized from the initial
        // `webPreviewURL` value, but is re-written here to use the origin from the
        // actual in use `webPreviewURL`.
        // TODO: Remove this one SDK 39 has been deprecated
        // @ts-ignore See above
        state.session.transports['webplayer']?.updateOrigin?.(new URL(webPreviewURL).origin);
        return {
          webPreviewURL,
        };
      }
    }
    return null;
  }

  componentDidMount() {
    if (this.state.verbose) {
      console.info(
        `%c INFO `,
        `background: #2196f3; color: #fff`,
        'Verbose logging is enabled, open the web-preview in a popup to view runtime logs'
      );
    }

    // Clear import from embedded session
    if (window.__snack_embedded_session) {
      window.__snack_embedded_session = undefined;
    }

    if (this.state.verbose && process.env.NODE_ENV !== 'production') {
      Analytics.getInstance().verbose = true;
    }

    if (window.location.host.includes('expo.io')) {
      Raven.config('https://6501f7d527764d85b045b0ce31927c75@sentry.io/191351').install();
      const build_date = new Date(process.env.BUILD_TIMESTAMP ?? 0).toUTCString();
      Raven.setTagsContext({ build_date });
      Analytics.getInstance().identify({ build_date });
    }

    Analytics.getInstance().setCommonData({
      snackId: this.state.session.id,
      isEmbedded: !!this.props.isEmbedded,
      previewPane: this.state.devicePreviewShown ? this.state.devicePreviewPlatform : 'hidden',
    });

    if (this.state.wasUpgraded) {
      Analytics.getInstance().logEvent('LOADED_UNSUPPORTED_VERSION', {
        requestedVersion: this.state.initialSdkVersion,
        snackId: this.props.match.params.id,
      });
    }

    Analytics.getInstance().logEvent('LOADED_SNACK', {
      sdkVersion: this.state.session.sdkVersion,
    });

    this._snackStateListener = this._snack.addStateListener(this._handleSessionStateChange);
    this._snackLogListener = this._snack.addLogListener(this._handleSessionLog);

    this._snack.setDisabled(false);

    this._isFocused = document.hasFocus();
    this._focusTimer = window.setInterval(this._handleFocusChangeInterval, 500);

    this._broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME, {
      webWorkerSupport: false,
    });

    // Let other tabs know that a new tab is opened
    this._broadcastChannel.postMessage({
      type: 'NEW_TAB',
      id: this.state.session.id,
    });

    // Listen to messages from other tabs
    this._broadcastChannel.addEventListener('message', this._handleBroadcastChannelMessage);

    this._enablePubNubIfNeeded();

    window.addEventListener('unload', this._handleUnload);

    if (this.props.query.saveToAccount === 'true') {
      if (this._snack.getState().user) {
        this._saveAsync();
      }
    }
  }

  componentWillUnmount() {
    this._snackStateListener?.();
    this._snackLogListener?.();

    this._snack.setDisabled(true);
    this._snack.setOnline(false);

    this._broadcastChannel.close();

    window.removeEventListener('unload', this._handleUnload);

    clearInterval(this._focusTimer);
    this._focusTimer = undefined;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (
      prevState.devicePreviewShown !== this.state.devicePreviewShown ||
      prevState.devicePreviewPlatform !== this.state.devicePreviewPlatform
    ) {
      Analytics.getInstance().updateCommonData({
        previewPane: this.state.devicePreviewShown ? this.state.devicePreviewPlatform : 'hidden',
      });
    }
    if (this.props.viewer !== prevProps.viewer) {
      const sessionSecret = this.props.getSessionSecret();
      if (this.state.session.user?.sessionSecret !== sessionSecret) {
        this._snack.setUser(sessionSecret ? { sessionSecret } : undefined);
      }
    }
  }

  _snack: Snack;
  _snackStateListener?: SnackListenerSubscription;
  _snackLogListener?: SnackListenerSubscription;

  _broadcastChannel: BroadcastChannel = undefined as any;

  _isFocused: boolean = false;
  _focusTimer: number | undefined;

  _handleFocusChangeInterval = () => {
    const isFocused = document.hasFocus();
    if (this._isFocused !== isFocused) {
      this._isFocused = isFocused;
      if (isFocused) {
        this._snack.setFocus();
      }
    }
  };

  _handleBroadcastChannelMessage = (e: any) => {
    const { id } = this.state.session;

    // Only respond to messages which have the same snack
    if (e.id !== id || !e.id) {
      return;
    }

    switch (e.type) {
      case 'NEW_TAB':
        {
          let autosaveEnabled;

          if (this.state.isSavedOnce) {
            autosaveEnabled = this.state.autosaveEnabled;
          } else {
            // If we have never saved in this tab, disable autosave in this tab
            // It allows the user to autosave in the new tab which is more covenient
            this.setState({
              autosaveEnabled: false,
            });

            autosaveEnabled = false;
          }

          // If another tab with same snack is opened,
          // Let it know that there's a duplicate tab
          this._broadcastChannel.postMessage({
            type: 'DUPLICATE_TAB',
            id,
            autosaveEnabled,
          });
        }
        break;
      case 'DUPLICATE_TAB':
        // If there's a duplicate tab, and it has autosave enabled,
        // Disable autosave in the current tab
        if (e.autosaveEnabled) {
          this.setState({ autosaveEnabled: false });
        }

        break;
    }
  };

  _handleUnload = async () => {
    if (navigator.sendBeacon && this.state.session.sendBeaconCloseRequest) {
      const { url, data } = this.state.session.sendBeaconCloseRequest;
      navigator.sendBeacon(url, data);
    }
  };

  _handleDeviceConnectionAttempt = () => {
    this._snack.setOnline(true);
  };

  _handleToggleSendCode = () =>
    this.setState(({ sendCodeOnChangeEnabled }) => {
      this._snack.setCodeChangesDelay(sendCodeOnChangeEnabled ? -1 : 1000);
      return {
        sendCodeOnChangeEnabled: !sendCodeOnChangeEnabled,
      };
    });

  _handleSendCode = () => {
    this._snack.sendCodeChanges();
  };

  _handleSessionLog = (event: SnackLogEvent) => {
    const deviceLog: DeviceLog = {
      device: {
        name: event.connectedClient?.name ?? '',
        id: event.connectedClient?.id ?? '',
        platform: (event.connectedClient?.platform ?? '') as any,
        status: 'connected',
        timestamp: Date.now(),
      },
      method: event.type as any,
      payload: [event.message],
    };

    this.setState((state) => ({
      deviceLogs: [...state.deviceLogs.slice(-99), deviceLog],
    }));
  };

  _handleSessionStateChange = (state: SnackState, prevState: SnackState) => {
    // console.log('Session state change: ', diff(prevState, state), state); // deep-object-diff

    this.setState(
      (st) => {
        const { connectedClients } = state;
        let annotations: Annotation[] | undefined;
        let connectedDevices: Device[] | undefined;

        // Update connected devices
        if (state.connectedClients !== prevState.connectedClients) {
          connectedDevices = connectedDevices ?? [];
          for (const key in connectedClients) {
            const { id, name, platform } = connectedClients[key];
            connectedDevices.push({
              name,
              id,
              platform: platform as any,
              status: 'connected',
              timestamp: 0,
            });
          }
        }

        // Update connection annotations
        if (state.connectedClients !== prevState.connectedClients) {
          annotations = annotations ?? [];
          for (const key in connectedClients) {
            const { error, transport } = connectedClients[key];
            if (error) {
              annotations.push({
                message: error.message,
                location: error.fileName
                  ? {
                      fileName: error.fileName,
                      startLineNumber: error.lineNumber ?? 0,
                      endLineNumber: error.lineNumber ?? 0,
                      startColumn: (error.columnNumber ?? 0) + 1,
                      endColumn: (error.columnNumber ?? 0) + 1,
                    }
                  : undefined,
                severity: 4,
                source: transport === 'web-player' ? 'Web' : 'Device',
              });
            }
          }
        }

        // Set save-status to changed if needed
        const saveStatus: SaveStatus =
          state.unsaved &&
          (st.saveStatus === 'saved-draft' ||
            st.saveStatus === 'published' ||
            st.saveStatus === 'unsaved')
            ? this.edited
              ? 'edited'
              : 'unsaved'
            : st.saveStatus;

        // Update session state
        return {
          session: state,
          saveStatus,
          annotations: annotations ?? st.annotations,
          connectedDevices: connectedDevices ?? st.connectedDevices,
        };
      },
      () => this._saveDraftIfNeeded(true)
    );

    // Record any dependency errors
    if (state.dependencies !== prevState.dependencies) {
      for (const name in state.dependencies) {
        const dep = state.dependencies[name];
        if (dep.error && dep.error !== prevState.dependencies[name]?.error) {
          Raven.captureMessage(dep.error.message);
        }
      }
    }
  };

  _reloadSnack = () => this._snack.reloadConnectedClients();

  _handleSubmitMetadata = (details: { name: string; description: string }) => {
    this.edited = true;
    this._snack.setName(details.name);
    this._snack.setDescription(details.description);
  };

  _handleChangeSDKVersion = (sdkVersion: SDKVersion) => {
    this.edited = true;
    this._snack.setSDKVersion(sdkVersion);
  };

  _handleClearDeviceLogs = () =>
    this.setState({
      deviceLogs: [],
    });

  _handleDownloadAsync = async () => {
    this.setState({ isDownloading: true });

    // Make sure file is saved before downloading
    const { saveStatus } = this.state;
    if (saveStatus !== 'published') {
      await this._saveAsync({
        ignoreUser: true,
        excludeFromHistory: true,
      });
    }

    let once = true;
    this.setState((state) => {
      const { id } = state.session;
      if (!id) {
        // this shouldn't happen
        return {
          saveStatus,
          isDownloading: false,
        };
      }

      // In strict-mode on development, this handler is called twice
      // so prevent the download from starting twice
      if (once) {
        once = false;
        Analytics.getInstance().logEvent('DOWNLOADED_CODE');

        const url = `${process.env.API_SERVER_URL}/--/api/v2/snack/download/${id}`;

        // Simulate link click to download file
        const element = document.createElement('a');
        if (element && document.body) {
          document.body.appendChild(element);
          element.setAttribute('href', url);
          element.setAttribute('download', 'snack.zip');
          element.style.display = '';
          element.click();

          document.body.removeChild(element);
        }
      }

      return {
        saveStatus,
        isDownloading: false,
      };
    });
  };

  _saveDraftIfNeeded = (debounced?: boolean) => {
    if (
      this.state.session.user &&
      this.state.session.unsaved &&
      this.state.autosaveEnabled &&
      this.state.saveStatus === 'edited'
    ) {
      if (debounced) {
        this._saveDraftIfNeededDebounced();
      } else {
        this._saveAsync({ isDraft: true });
      }
    }
  };

  _saveDraftIfNeededDebounced = debounce(this._saveDraftIfNeeded, 3000);

  _saveAsync = async (options: SaveOptions = {}) => {
    const { isDraft, ignoreUser, excludeFromHistory } = options;
    this.setState({
      saveStatus: isDraft || excludeFromHistory ? 'saving-draft' : 'publishing',
    });

    if (!isDraft) {
      let cntCodeFile = 0;
      let cntAssetFile = 0;
      const cntDependencies = Object.keys(this.state.session.dependencies).length;
      let codeSize = 0;
      for (const path in this.state.session.files) {
        const file = this.state.session.files[path];
        if (file.type === 'CODE') {
          cntCodeFile++;
          codeSize += file.contents.length;
        } else {
          cntAssetFile++;
        }
      }
      Analytics.getInstance().logEvent(
        'SAVED_SNACK',
        { cntCodeFile, cntAssetFile, codeSize, cntDependencies },
        'lastSave'
      );
      Analytics.getInstance().startTimer('lastSave');
    }

    try {
      this.edited = false;
      const saveResult = await this._snack.saveAsync({
        isDraft,
        ignoreUser,
      });

      if (!excludeFromHistory) {
        this.props.history.push({
          pathname: `/${saveResult.id}`,
          search: this.props.location.search,
        });
      }

      this.setState((state) => ({
        isSavedOnce: true,
        saveHistory: excludeFromHistory
          ? state.saveHistory
          : [
              { hashId: saveResult.hashId ?? '', savedAt: new Date().toISOString(), isDraft },
              ...state.saveHistory,
            ],
        saveStatus: state.session.unsaved
          ? this.edited
            ? 'edited'
            : 'unsaved'
          : isDraft
          ? 'saved-draft'
          : 'published',
      }));
    } catch (e) {
      this.edited = true;
      this.setState({ saveStatus: 'edited' });
      throw e;
    }
  };

  _setDeviceId = (deviceId: string) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DEVICE_ID_KEY, deviceId);
      } catch (e) {
        // Do nothing
      }
    }

    this._snack.setDeviceId(deviceId);
  };

  _handleOpenEditor = () => {
    this.setState({ isPreview: false });
  };

  _uploadAssetAsync = (asset: File) => {
    return this._snack.uploadAssetAsync(asset);
  };

  _handleTogglePreview = () => {
    if (!this.props.isEmbedded) {
      this.props.setPreferences({
        devicePreviewShown: !this.state.devicePreviewShown,
      });
    }
    this.setState(
      (state) => ({
        devicePreviewShown: !state.devicePreviewShown,
      }),
      this._enablePubNubIfNeeded
    );
  };

  _handleChangePreviewPlatform = (platform: Platform) => {
    if (!this.props.isEmbedded) {
      this.props.setPreferences({
        devicePreviewPlatform: platform,
      });
    }
    this.setState(
      () => ({
        devicePreviewPlatform: platform,
      }),
      this._enablePubNubIfNeeded
    );
  };

  _handleSelectFile = (path: string) => {
    this.setState((state) => (state.selectedFile !== path ? { selectedFile: path } : null));
  };

  _enablePubNubIfNeeded = () => {
    if (
      !this.props.isEmbedded ||
      (this.state.devicePreviewShown && this.state.devicePreviewPlatform === 'mydevice')
    ) {
      // Make sure pubnub is enabled when mydevice tab is visible
      this._snack.setOnline(true);
    }
  };

  _updateFiles = (updateFn: (files: SnackFiles) => { [path: string]: SnackFile | null }) => {
    const state = this._snack.getState();
    const filesUpdate = updateFn(state.files);
    if (Object.keys(filesUpdate).length) {
      this.edited = true;
      this._snack.updateFiles(filesUpdate);
    }
  };

  _updateDependencies = (
    updateFn: (dependencies: SnackDependencies) => { [path: string]: SnackDependency | null }
  ) => {
    const state = this._snack.getState();
    const dependenciesUpdate = updateFn(state.dependencies);
    if (Object.keys(dependenciesUpdate).length) {
      this.edited = true;
      this._snack.updateDependencies(dependenciesUpdate);
    }
    return this._snack.getState().dependencies;
  };

  render() {
    const { isEmbedded } = this.props;
    const experienceURL = this.state.session.url;
    if (this.state.isPreview) {
      return (
        <AppDetails
          name={this.state.session.name}
          description={this.state.session.description}
          experienceURL={experienceURL}
          onOpenEditor={this._handleOpenEditor}
          userAgent={this.props.userAgent}
          onDeviceConnectionAttempt={this._handleDeviceConnectionAttempt}
        />
      );
    }

    let isResolving = false;
    for (const name in this.state.session.dependencies) {
      const dep = this.state.session.dependencies[name];
      if (
        !dep.handle &&
        !dep.error &&
        !isResolving &&
        !this.state.session.disabled &&
        !isModulePreloaded(name, this.state.session.sdkVersion)
      ) {
        isResolving = true;
      }
    }

    return (
      <LazyLoad<React.ComponentType<EditorViewProps>>
        load={() => (isEmbedded ? import('./EmbeddedEditorView') : import('./EditorView'))}>
        {({ loaded, data: Comp }) =>
          loaded && Comp ? (
            <Comp
              annotations={this.state.annotations}
              autosaveEnabled={this.state.autosaveEnabled}
              connectedDevices={this.state.connectedDevices}
              createdAt={this.props.snack ? this.props.snack.created : undefined}
              dependencies={this.state.session.dependencies}
              missingDependencies={this.state.session.missingDependencies}
              description={this.state.session.description}
              deviceId={this.state.session.deviceId}
              deviceLogs={this.state.deviceLogs}
              experienceURL={experienceURL}
              experienceName={this.state.session.onlineName ?? this.state.session.name}
              files={this.state.session.files}
              isDownloading={this.state.isDownloading}
              isResolving={isResolving}
              name={this.state.session.name}
              id={this.state.session.id}
              onChangeSDKVersion={this._handleChangeSDKVersion}
              onClearDeviceLogs={this._handleClearDeviceLogs}
              onDeviceConnectionAttempt={this._handleDeviceConnectionAttempt}
              onDownloadAsync={this._handleDownloadAsync}
              onPublishAsync={this._saveAsync}
              onReloadSnack={this._reloadSnack}
              onSendCode={this._handleSendCode}
              onSubmitMetadata={this._handleSubmitMetadata}
              onToggleSendCode={this._handleToggleSendCode}
              onTogglePreview={this._handleTogglePreview}
              onChangePlatform={this._handleChangePreviewPlatform}
              onSelectFile={this._handleSelectFile}
              platform={this.state.devicePreviewPlatform}
              platformOptions={this.state.devicePreviewPlatformOptions}
              previewRef={this._previewRef}
              previewShown={this.state.devicePreviewShown}
              previewURL={this.state.webPreviewURL}
              payerCode={this.props.query.appetizePayerCode}
              saveHistory={this.state.saveHistory}
              saveStatus={this.state.saveStatus}
              sdkVersion={this.state.session.sdkVersion}
              selectedFile={this.state.selectedFile}
              sendCodeOnChangeEnabled={this.state.sendCodeOnChangeEnabled}
              setDeviceId={this._setDeviceId}
              snackagerURL={this.state.snackagerURL}
              updateDependencies={this._updateDependencies}
              updateFiles={this._updateFiles}
              uploadFileAsync={this._uploadAssetAsync}
              userAgent={this.props.userAgent}
              verbose={this.state.verbose}
              wasUpgraded={this.state.wasUpgraded}
            />
          ) : isEmbedded ? (
            <EmbeddedShell />
          ) : (
            <AppShell
              title={this.state.session.name}
              previewShown={this.state.devicePreviewShown}
            />
          )
        }
      </LazyLoad>
    );
  }
}

const MainContainer = withPreferences(
  connect((state: any) => ({
    viewer: state.viewer,
  }))(withAuth(Main))
);

/**
 * Fetch code from a remote source (if provided) before rendering the main app
 */

type AsyncState = {
  isReady: boolean;
  files: SnackFiles;
  error?: Error;
};

export default class AsyncApp extends React.Component<Props, AsyncState> {
  constructor(props: Props) {
    super(props);

    try {
      const files = getFilesFromQuery(props.query, DEFAULT_CODE);
      const isReady = !Object.values(files).find((file: any) => file.url);
      this.state = {
        files,
        isReady,
      };
    } catch (e) {
      this.state = {
        error: e,
        files: DEFAULT_CODE,
        isReady: true,
      };
    }
  }

  componentDidMount() {
    if (!this.state.isReady) {
      this.loadFilesAsync(this.state.files);
    } else if (this.state.error) {
      alert(this.state.error.message);
    }
  }

  private async loadFilesAsync(files: any) {
    // Minimum amount of time to show the loading indicator for, so it doesn't
    // just flicker in and out
    const MIN_LOADING_MS = 1500;
    const startTime = Date.now();

    // Load all files with external urls
    const paths = Object.keys(files);
    try {
      const contents = await Promise.all(
        Object.values(files).map(async (file: any, index: number) => {
          const path = paths[index];
          if (file.url) {
            try {
              const response = await fetch(file.url);
              if (!response.ok) {
                throw new Error(`${response.status} - ${response.statusText}`);
              }
              const code = await response.text();
              return code;
            } catch (e) {
              throw new Error(`We were unable to load code for file "${path}" (${e.message})`);
            }
          } else if (file.contents) {
            return file.contents;
          } else {
            throw new Error(`No code specified for file "${path}"`);
          }
        })
      );
      files = { ...files };
      paths.forEach((path, index) => {
        files[path] = {
          type: files[path].type,
          contents: contents[index],
        };
      });
    } catch (e) {
      alert(e.message);
      files = { ...files };
      paths.forEach((path) => {
        files[path] = {
          type: files[path].type,
          contents: '',
        };
      });
      this.setState({
        isReady: true,
        files,
      });
      return;
    }

    // Upon load, show the whole snack
    const duration = Date.now() - startTime;
    setTimeout(
      () => {
        this.setState({
          isReady: true,
          files,
        });
      },
      duration < MIN_LOADING_MS ? MIN_LOADING_MS - duration : 0
    );
  }

  render() {
    if (this.state.isReady) {
      return <MainContainer {...this.props} files={this.state.files} />;
    } else {
      return (
        <div className={css(styles.container)}>
          <div className={css(styles.logo)}>
            <AnimatedLogo />
          </div>
          <p className={css(styles.loadingText)}>Loading code from external source...</p>
        </div>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    display: 'flex',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    transform: 'scale(0.5)',
    opacity: 0.9,
  },
  loadingText: {
    marginTop: 0,
    opacity: 0.7,
    fontSize: 18,
  },
});

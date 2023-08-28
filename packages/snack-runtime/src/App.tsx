import './polyfill';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { activateKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import {
  AppState,
  PixelRatio,
  Dimensions,
  Platform,
  EmitterSubscription,
  NativeEventSubscription,
} from 'react-native';
import { createVirtualModulePath } from 'snack-require-context';

import { AppLoading } from './AppLoading';
import BarCodeScannerView from './BarCodeScannerView';
import * as Console from './Console';
import { SNACK_API_URL } from './Constants';
import * as Errors from './Errors';
import * as Files from './Files';
import LoadingView from './LoadingView';
import * as Logger from './Logger';
import * as Messaging from './Messaging';
import * as Modules from './Modules';
import EXDevLauncher from './NativeModules/EXDevLauncher';
import { ExpoRouterApp, isExpoRouterEntry } from './NativeModules/ExpoRouterEntry';
import Linking from './NativeModules/Linking';
import { captureRef as takeSnapshotAsync } from './NativeModules/ViewShot';
import getDeviceIdAsync from './NativeModules/getDeviceIdAsync';
import * as Profiling from './Profiling';
import UpdateIndicator from './UpdateIndicator';
import { SnackRuntimeContext } from './config/SnackConfig';
import { type SnackApiCode, fetchCodeBySnackIdentifier } from './utils/ExpoApi';
import {
  extractChannelFromSnackUrl,
  extractSnackIdentifierFromSnackUrl,
  parseExperienceURL,
} from './utils/SnackUrls';

export type SnackState = 'loading' | 'finished' | 'error';

type Props = {
  /**
   * When passing a Snack URL, the Snack will be loaded instead of the barcode scanner.
   * URLs must have the following format:
   *   - `(exp|https)://exp.host/{owner}/{snackName}+{snackSessionId}`
   *     This loads a Snack, and connects to the Snack website using the session ID.
   *   - `(exp|https)://exp.host/{owner}/{snackName}`
   *     This loads a Snack directly from the API, and won't connect to any editor.
   *
   * @example exp://exp.host/@bycedric/great-bagel+REEOUkskIw
   * @example https://exp.host/@bycedric/great-pancake
   */
  snackUrl?: string;

  /**
   * Callback for when the Snack wants to reload the current URL.
   * This is invoked by the "reload now" button on the Snack website.
   */
  onSnackReload?: () => Promise<any>;

  /**
   * Callback for Snack state changes, like "loading" or "finished".
   */
  onSnackState?: (state: SnackState) => any;
};

type State = {
  initialLoad: boolean;
  initialURL: string;
  showSplash: boolean;
  isLoading: boolean;
  showBarCodeScanner: boolean;
  rootElement: React.ReactElement | null;
  channel: string | null;
  snackIdentifier: string | null;
  foreground: boolean;
  isConnected: boolean;
  loadingElement: React.ReactNode;
};

const RELOAD_URL_KEY = 'snack-reload-url';
const ONE_MINUTE = 1000 * 60;

// Last known Snack state workaround, the App component is too big to incorporate the state updates
let prevSnackState: SnackState;
/** Notify the `onSnackState` event callback whenever the Snack changes its state */
function notifyStateChange(props: Pick<Props, 'onSnackState'>, state: SnackState) {
  if (state !== prevSnackState) {
    props.onSnackState?.(state);
  }
}

// The root component for Snack's viewer. Allows scanning a barcode to identify a Snack, listens for
// updates and displays the Snack.
export default class App extends React.Component<Props, State> {
  static contextType = SnackRuntimeContext;

  state: State = {
    initialLoad: true,
    initialURL: '',
    showSplash: Platform.OS !== 'web',
    isLoading: true,
    showBarCodeScanner: false,
    rootElement: null, // Root React element produced by the user's application
    channel: null,
    snackIdentifier: null,
    foreground: true,
    isConnected: false,
    loadingElement: <LoadingView />,
  };

  private subscriptions: (EmitterSubscription | NativeEventSubscription)[] = [];

  async componentDidMount() {
    Profiling.checkpoint('`App.componentDidMount()` start');

    let initialURL: string | null =
      this.props.snackUrl ?? EXDevLauncher.manifestURL ?? (await Linking.getInitialURL());

    // Generate unique device-id
    const deviceId = await getDeviceIdAsync();

    // Initialize messaging transport
    const testTransport = initialURL ? parseExperienceURL(initialURL)?.testTransport : null;
    Messaging.init(deviceId, testTransport);

    // Initialize various things
    this._awaitingModulesInitialization = Modules.initialize(this.context);
    Console.initialize((method: string, payload: unknown[]) => {
      // Send any intercepted console.x calls to the sdk.
      // Errors are made serializable and converted to a string.
      Messaging.publish({
        type: 'CONSOLE',
        method,
        payload: payload.map((item) => {
          if (typeof item === 'object') {
            if (item instanceof Error) {
              const stack = Errors.prettyStack(item).split('\n', 4).join(' << ');
              return `Error: "${item.message}" in ${stack}\n...`;
            }
            try {
              return JSON.stringify(item);
            } catch {}
          }
          return String(item);
        }),
      });
    });
    this._listenForUpdates(deviceId);

    // Keep the device awake so the user doesn't have to keep waking it while coding
    activateKeepAwake();

    // If we have an entry point file already, we can load now
    if (Files.get(Files.entry())) {
      this._reloadModules();
    }

    try {
      // Open from the initial URL if given

      if (!initialURL) {
        // Check for any stored URLs for reload
        const result = JSON.parse((await AsyncStorage.getItem(RELOAD_URL_KEY)) ?? '{}');
        if (result?.url) {
          // Remove the stored URL so next refresh can start fresh
          // For example, in development, we want the barcode scanner
          await AsyncStorage.removeItem(RELOAD_URL_KEY);

          // If there is no initial URL, check if the stored URL is new
          // We discard if it's older than 15 mins
          // 15 mins is probably too long, but it doesn't really matter
          // since initial URL will only be empty during development and reload
          if (Date.now() - result.timestamp < ONE_MINUTE * 15) {
            Logger.info('Found reload URL', result.url);

            initialURL = result.url;
          } else {
            Logger.info('Found reload URL, but it was expired', result.url);
          }
        }
      } else {
        Logger.info('Found initial URL', initialURL);
      }

      if (initialURL) {
        this._openUrl(initialURL);
      }
    } catch (e) {
      Logger.error('An error occurred when getting URL', e);
    }

    if (!this._currentUrl) {
      if (!Files.get(Files.entry())) {
        // Else show the barcode scanner
        // eslint-disable-next-line react/no-did-mount-set-state
        this.setState(() => ({
          showSplash: false,
          showBarCodeScanner: true,
          initialURL: initialURL ?? '',
        }));
      }
    } else {
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState(() => ({ showSplash: false }));
    }

    this.subscriptions = [
      Linking.addEventListener('url', this._handleOpenUrl),
      AppState.addEventListener('change', this._handleAppStateChange),
    ];
  }

  componentWillUnmount() {
    this.subscriptions?.forEach((subscription) => subscription.remove());
  }

  _view?: Errors.ErrorBoundary | null;
  _awaitingModulesInitialization?: Promise<void>;

  _handleOpenUrl = async (data: { url: string }) => {
    if (data.url) {
      Logger.info('URL changed', data.url);
      this._openUrl(data.url);
    }
  };

  // `BarCodeScannerView` read a URL, try to open it
  _handleBarCodeRead = ({ data }: { data: string }) => {
    Logger.info('Scanned barcode', data);

    try {
      if (this._openUrl(data)) {
        this.setState({ showBarCodeScanner: false });
      }
    } catch (e) {
      Logger.error(e);
    }
  };

  _handleAppStateChange = (
    appState: 'active' | 'inactive' | 'background' | 'unknown' | 'extension'
  ) => {
    const foreground = appState === 'active';

    if (this.state.foreground !== foreground) {
      Logger.info('App state changed to', appState);

      this.setState({ foreground });

      if (foreground) {
        const { channel } = this.state;

        if (channel) {
          Messaging.subscribe({ channel });
          this._askForCode();
        } else if (!Files.get(Files.entry())) {
          this.setState({ showBarCodeScanner: true });
        }
      } else {
        this._cancelAskForCode();
        Messaging.unsubscribe();
      }
    }
  };

  _currentUrl?: string;

  // Open Snack session at given `url`, throw if bad URL or couldn't connect. All we need to do is
  // subscribe to the associated messaging channel, everything else is triggered by messages.
  _openUrl = (url: string): boolean => {
    // Notify the `onSnackState` event callback that a Snack is being loaded
    notifyStateChange(this.props, 'loading');

    // Connect to the Snack website session, if the URL contains a channel or session ID
    const channel = extractChannelFromSnackUrl(url);
    if (channel) {
      this._currentUrl = url;

      Logger.info('Opening Snack session', url);

      this.setState({
        channel,
        snackIdentifier: null, // TODO: Use proper Snack identifier when available
        initialURL: url,
      });

      Profiling.checkpoint('`_openUrl()` read');

      Messaging.subscribe({ channel });
      this._askForCode();

      return true;
    }

    // Load the Snack directly from the API when the URL does not contain a channel or session ID
    const snackIdentifier = extractSnackIdentifierFromSnackUrl(url);
    if (snackIdentifier) {
      this._currentUrl = url;

      Logger.info('Opening URL', url);

      this.setState({
        channel: null,
        snackIdentifier,
        initialURL: url,
      });

      Messaging.unsubscribe();
      Profiling.checkpoint('`_openUrl()` read');

      // Load the code in the background, without blocking the UI
      fetchCodeBySnackIdentifier(snackIdentifier).then((res) => {
        if (res) this._handleCodeFetch(res);

        // TODO: Handle proper error responses
      });

      return true;
    }

    Logger.warn(
      `Snack URL didn't match any of the following formats:
        - 'https://exp.host/@snack/SAVE_UUID+CHANNEL_UUID'
        - 'https://exp.host/@snack/sdk.14.0.0-CHANNEL_UUID'
        - 'https://exp.host/@snack/SAVE_UUID'
        - 'https://exp.host/@USERNAME/SNACK_SLUG'
      `
    );

    // Notify that a misformed URL being passed, and the Snack can't be loaded
    notifyStateChange(this.props, 'error');

    return false;
  };

  _handleReloadSnack = async () => {
    const url = this._currentUrl;
    if (url) {
      Logger.info('Reloading app with URL', url);

      // On iOS, closing the app may not trigger unsubscribe
      // So we explicitly unsubscribe before reloading
      Messaging.unsubscribe();

      if (Platform.OS === 'ios') {
        // If we immediately reload, unsubscription message isn't sent yet
        // Add this timeout to make sure that it is
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Store the current URL and timestamp in asyncstorage
      // When the app reloads, it can read the stored URL to open the snack
      await AsyncStorage.setItem(
        RELOAD_URL_KEY,
        JSON.stringify({
          url,
          timestamp: Date.now(),
        })
      );

      await this.props.onSnackReload?.();
    } else {
      Logger.info("Got a reload request, but we don't have a URL");
    }
  };

  // @ts-ignore: NodeJS.Timeout not defined?
  _askTimeout?: NodeJS.Timeout;

  _askForCode = () => {
    let time = 3 * 1000;

    this._cancelAskForCode();

    const ask = () => {
      if (this.state.initialLoad) {
        time = time * 1.2;
        this._askTimeout = setTimeout(ask, time);
        Messaging.publish({ type: 'RESEND_CODE' });
      }
    };

    this._askTimeout = setTimeout(ask, time);

    Messaging.publish({ type: 'RESEND_CODE' });
  };

  _cancelAskForCode = () => {
    if (this._askTimeout) {
      clearTimeout(this._askTimeout);
      this._askTimeout = undefined;
    }
  };

  _uploadPreviewToS3 = async (asset: string, height: number, width: number) => {
    const url = `${SNACK_API_URL}/--/api/v2/snack/uploadPreview`;
    const body = JSON.stringify({ asset, height, width });
    try {
      Logger.info('Uploading preview...', 'width', width, 'height', height);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const data = await response.json();
      return data.url;
    } catch (e) {
      throw new Error('Unable to upload asset to S3: ' + e.message);
    }
  };

  // Listen for Snack updates
  _listenForUpdates(deviceId: string) {
    Messaging.listen(async ({ message }) => {
      Logger.comm_recv('Message received', message);

      this.setState((state) => (!state.isConnected ? { isConnected: true } : null));

      switch (message.type) {
        case 'CODE': {
          // Stop asking for code if we received it
          this._cancelAskForCode();

          Profiling.checkpoint('`CODE` message recv');
          this._lastCodeUpdatePromise = this._handleCodeUpdate(
            message,
            this._lastCodeUpdatePromise,
            deviceId
          );
          break;
        }
        case 'REQUEST_STATUS': {
          const pixelRatio = PixelRatio.get();
          const dims = Dimensions.get('window');
          const height = dims.height / pixelRatio;
          const width = dims.width / pixelRatio;

          if (this._view) {
            let previewLocation = null;
            try {
              const snapshot = await takeSnapshotAsync(this._view, {
                format: 'jpg',
                quality: 0.4,
                result: 'base64',
                height,
                width,
                snapshotContentContainer: false,
              });
              if (snapshot) {
                previewLocation = await this._uploadPreviewToS3(snapshot, height, width);
              }
            } catch (e) {
              Logger.error('Failed to record preview', e);
            }
            Messaging.publish({
              type: 'STATUS_REPORT',
              previewLocation,
              status: Errors.status(),
            });
          }
          break;
        }
        case 'RELOAD_SNACK':
          this._handleReloadSnack();
          break;
      }
    });
  }

  _lastCodeUpdatePromise = Promise.resolve();

  _handleCodeUpdate = async (message: any, waitForPromise: Promise<any>, deviceId: string) => {
    await waitForPromise;
    await Profiling.section(`'CODE' message`, async () => {
      this.setState(() => ({ isLoading: true }));

      // Update project-level dependency info if given
      let changedDependencies: string[] = [];
      if (message.dependencies) {
        changedDependencies = await Modules.updateProjectDependencies(message.dependencies);
      }

      // Update local files and reload
      const changedPaths = await Files.update({ message });

      // Reload modules when anything has changed
      if (changedDependencies.length || changedPaths.length) {
        Profiling.checkpoint('`CODE` message `_reloadModules()` begin');
        await this._reloadModules({ changedPaths, changedDependencies });
      } else {
        Logger.warn('Code message received but no changes detected, ignoring');
        this.setState(() => ({ isLoading: false }));
      }

      notifyStateChange(this.props, 'finished');
    });
  };

  _handleCodeFetch = async (response: SnackApiCode) => {
    await Profiling.section(`Fetched code from API`, async () => {
      this.setState(() => ({ isLoading: true }));

      // Update project-level dependency info if given
      let changedDependencies: string[] = [];
      if (response.dependencies) {
        changedDependencies = await Modules.updateProjectDependencies(response.dependencies);
      }

      // Update local files and reload
      await Files.updateProjectFiles(response.code);
      const changedPaths = Object.keys(response.code);

      // Reload modules when anything has changed
      if (changedDependencies.length || changedPaths.length) {
        Profiling.checkpoint('Fetched code from API `_reloadModules()` begin');
        await this._reloadModules({ changedPaths, changedDependencies });
      } else {
        Logger.warn('Code message received but no changes detected, ignoring');
        this.setState(() => ({ isLoading: false }));
      }

      notifyStateChange(this.props, 'finished');
    });
  };

  // Flush stale modules given local file paths that have changed. If needed, load the root module
  // and construct a React element out of its default export and save it for us to render.
  async _reloadModules({
    changedPaths = [],
    changedDependencies = [],
  }: { changedPaths?: string[]; changedDependencies?: string[] } = {}) {
    Logger.module('Reloading, files changed', changedPaths.concat(changedDependencies), '...');
    if (this._awaitingModulesInitialization) {
      await this._awaitingModulesInitialization;
      this._awaitingModulesInitialization = undefined;
    }

    let rootElement: React.ReactElement | undefined;
    try {
      const rootModuleUri = 'module://' + Files.entry();

      // Handle Expo Router root with a Snack compatible components
      if (isExpoRouterEntry(Files.get(Files.entry())?.contents)) {
        // Flush without flushing the root component
        await Modules.flush({ changedPaths, changedUris: [] });

        const ctx = await Modules.load(createVirtualModulePath({ directory: 'module://app' }));
        Logger.info('Updating Expo Router root element');
        rootElement = React.createElement(ExpoRouterApp, { ctx });
      }
      // Handle normal default exports
      else {
        // Flush with the root component
        await Modules.flush({ changedPaths, changedUris: [rootModuleUri] });
        const hasRootModuleUri = await Modules.has(rootModuleUri);
        if (!hasRootModuleUri) {
          const rootDefaultExport = (await Modules.load(rootModuleUri)).default;
          if (!rootDefaultExport) {
            throw new Error(`No default export of '${Files.entry()}' to render!`);
          }
          Logger.info('Updating root element');
          rootElement = React.createElement(rootDefaultExport);
        }
      }
    } catch (e) {
      Errors.report(e);
    } finally {
      this.setState((state) => ({
        rootElement: rootElement ?? state.rootElement,
        isLoading: false,
        initialLoad: false,
        showSplash: false,
      }));
    }
  }

  render() {
    const {
      showSplash,
      showBarCodeScanner,
      rootElement,
      loadingElement,
      initialLoad,
      initialURL,
      isConnected,
      isLoading,
    } = this.state;

    if (showSplash) {
      return <AppLoading />;
    }

    if (showBarCodeScanner) {
      return (
        <>
          <StatusBar style="dark" />
          <BarCodeScannerView onBarCodeScanned={this._handleBarCodeRead} initialURL={initialURL} />
        </>
      );
    }

    // Render root element of the user's application if present, else a loading view. In
    // either case, surround by an `ErrorBoundary` to display errors and allow recovery.
    const isConnecting = !!this._currentUrl && !isConnected && !!this.state.channel; // Only show when Snack is connecting to a channel or session ID
    return (
      <>
        <StatusBar style="dark" />
        <Errors.ErrorBoundary ref={(view) => (this._view = view)}>
          {rootElement ?? loadingElement}
        </Errors.ErrorBoundary>
        <UpdateIndicator
          visible={isConnecting || isLoading}
          label={isConnecting ? 'Connecting…' : initialLoad ? 'Loading…' : 'Updating…'}
        />
      </>
    );
  }
}

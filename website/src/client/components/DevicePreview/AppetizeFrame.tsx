import { StyleSheet, css } from 'aphrodite';
import React, { Component, createRef } from 'react';

import { AppetizeDeviceControl } from './AppetizeDeviceControl';
import { SDKVersion } from '../../types';
import Analytics from '../../utils/Analytics';
import { getAppetizeConstants } from '../../utils/Appetize';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';

type AppetizeFrameProps = {
  /** The Apptize SDK version to use */
  sdkVersion: SDKVersion;
  /** The Appetize platform to use */
  platform: 'android' | 'ios';
  /** The Snack theme settings */
  theme: ThemeName;
  /** If snack is running in embed mode */
  isEmbedded: boolean;
  /** The Snack experience URL to load */
  experienceURL: string;
  /** Legacy callback to force the Snack to be online */
  onAppLaunch?: () => void;
  /** Legacy callback to reopen Appetize in a popup */
  onPopupUrl?: (url: string) => void;
};

type AppetizeFrameState = {
  session?: AppetizeSdkSession;
  deviceId?: string;
  queuePosition?: number;
  sentQueueInfo?: boolean;
  isReloadingSnack?: boolean;
};

export class AppetizeFrame extends Component<AppetizeFrameProps, AppetizeFrameState> {
  /** The Appetize SDK client singleton instance*/
  private client?: AppetizeSdkClient;
  /** The iframe ref, to reopen as a popup */
  private iframe = createRef<HTMLIFrameElement>();

  constructor(props: AppetizeFrameProps) {
    super(props);
    this.state = {}; // Note(cedric): this is somehow required...
  }

  componentDidMount() {
    // Load the Appetize client and setup initial bindings
    this.initAppetizeClient(resolveAppetizeConfig(this.props, this.state));

    window.addEventListener('beforeunload', this.endAppetizeSession);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.endAppetizeSession);
  }

  /**
   * Update the Appetize client when platform, sdkVersion, or theme change.
   */
  componentDidUpdate(prevProps: AppetizeFrameProps, prevState: AppetizeFrameState) {
    if (
      prevProps.sdkVersion !== this.props.sdkVersion ||
      prevProps.platform !== this.props.platform ||
      prevProps.theme !== this.props.theme ||
      prevProps.isEmbedded !== this.props.isEmbedded ||
      prevProps.experienceURL !== this.props.experienceURL ||
      prevState.deviceId !== this.state.deviceId
    ) {
      this.resetAppetizeClient(resolveAppetizeConfig(this.props, this.state));
    }
  }

  /** Initialize the Appetize SDK client */
  private initAppetizeClient = async (config: AppetizeSdkConfig) => {
    if (!this.client) {
      this.setState({ deviceId: config.device });

      this.client = await window.appetize.getClient('#snack-appetize', config);
      this.client.on('error', (error) => console.error('Appetize error:', error));
      this.client.on('queue', (queue) => this.onAppetizeQueue(queue));
      this.client.on('session', (session) => this.onAppetizeSession(session));
      this.client.on('sessionRequested', () => this.props.onAppLaunch?.());
    }

    return this.client;
  };

  /** Re-intialize the Appetize SDK client and clear any pending session */
  private resetAppetizeClient = async (config: AppetizeSdkConfig) => {
    await this.endAppetizeSession();
    await this.client?.setConfig(config);
    this.props.onPopupUrl?.(this.iframe.current!.src);
  };

  /** Clear any active Appetize sessions */
  private endAppetizeSession = async () => {
    if (this.state.session) {
      await this.state.session.end();
      this.setState({ session: undefined });
    }

    Analytics.getInstance().clearTimer('previewQueue');
  };

  /** Store the session reference and clear possible queue timer */
  private onAppetizeSession = (session: AppetizeSdkSession) => {
    this.setState({ session });
    this.props.onPopupUrl?.(this.iframe.current!.src);

    Analytics.getInstance().clearTimer('previewQueue');
  };

  /** Provide telemetry about queue build up */
  private onAppetizeQueue = (queue: AppetizeQueueEventData) => {
    if (!this.state.sentQueueInfo) {
      this.setState({ sentQueueInfo: true });

      Analytics.getInstance().startTimer('previewQueue');
      Analytics.getInstance().logEvent('QUEUED_FOR_PREVIEW', {
        queuePosition: queue.position,
      });
    }
  };

  private onReloadSnack = () => {
    if (this.state.session) {
      this.setState({ isReloadingSnack: true });
      this.state.session
        .openUrl(resolveAppetizeConfig(this.props, this.state).launchUrl!)
        .finally(() => this.setState({ isReloadingSnack: false }));
    }
  };

  private onDeviceChange = (deviceId: string) => this.setState({ deviceId });

  render() {
    return (
      <>
        <div className={css(this.props.isEmbedded ? styles.containerEmbedded : styles.container)}>
          <iframe id="snack-appetize" ref={this.iframe} className={css(styles.frame)} />
        </div>

        {!this.props.isEmbedded && (
          <AppetizeDeviceControl>
            <AppetizeDeviceControl.ReloadSnack
              onReloadSnack={this.onReloadSnack}
              canReloadSnack={!!this.state.session && !this.state.isReloadingSnack}
            />
            <AppetizeDeviceControl.SelectDevice
              platform={this.props.platform}
              selectedDevice={this.state.deviceId}
              onSelectDevice={this.onDeviceChange}
            />
          </AppetizeDeviceControl>
        )}
      </>
    );
  }
}

export default withThemeName(AppetizeFrame);

function resolveAppetizeConfig(
  props: AppetizeFrameProps,
  state: AppetizeFrameState
): AppetizeSdkConfig {
  const constants = getAppetizeConstants(props);
  const parameters = {
    EXDevMenuDisableAutoLaunch: true,
    EXKernelDisableNuxDefaultsKey: true,
  };

  return {
    ...constants,
    device: state.deviceId ?? constants.device,
    launchUrl: props.experienceURL,
    params: JSON.stringify(parameters) as any,
    appearance: props.theme,
    deviceColor: props.theme === 'light' ? 'black' : 'white',
    scale: 'auto',
    orientation: 'portrait',
    centered: 'both',
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 672,
    overflow: 'hidden',
    margin: 'auto',
    zIndex: 2,
  },
  containerEmbedded: {
    position: 'relative',
    height: 610,
    overflow: 'hidden',
    margin: 'auto',
    zIndex: 2,
  },
  frame: {
    border: 0,
    height: '100%',
  },
});

import { StyleSheet, css } from 'aphrodite';
import React, { Component, createRef } from 'react';

import { AppetizeDeviceControl } from './AppetizeDeviceControl';
import { SDKVersion } from '../../types';
import Analytics from '../../utils/Analytics';
import { getAppetizeConstants } from '../../utils/Appetize';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';

/** @see https://docs.appetize.io/core-features/playback-options */
export type AppetizeDeviceAndroid = 'none' | string;
/** @see https://docs.appetize.io/core-features/playback-options */
export type AppetizeDeviceIos = 'none' | string;

/** Custom Appetize device settings for embedded devices */
export type AppetizeDevices = {
  _showFrame: boolean;
  android?: { device?: AppetizeDeviceAndroid; scale?: number };
  ios?: { device?: AppetizeDeviceIos; scale?: number };
};

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
  /** Custom Appetize settings for embedded instances */
  devices?: AppetizeDevices;
  /** Legacy callback to force the Snack to be online */
  onAppLaunch?: () => void;
  /** Legacy callback to reopen Appetize in a popup */
  onPopupUrl?: (url: string) => void;
};

type AppetizeFrameState = {
  session?: AppetizeSdkSession;
  deviceId?: string;
  sentQueueInfo?: boolean;
  deviceControlState?: string;
};

export class AppetizeFrame extends Component<AppetizeFrameProps, AppetizeFrameState> {
  /** The Appetize SDK client singleton instance*/
  private client?: AppetizeSdkClient;
  /** The iframe ref, to reopen as a popup */
  private iframe = createRef<HTMLIFrameElement>();

  state: AppetizeFrameState = {
    session: undefined,
    deviceId: undefined,
    sentQueueInfo: false,
    deviceControlState: undefined,
  };

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
      const config = resolveAppetizeConfig(this.props, this.state);

      this.resetAppetizeClient(config);
      this.props.onPopupUrl?.(resolveAppetizePopupUrl(config));
    }

    // If the platform changes, update to the default device
    if (this.state.deviceId && prevProps.platform !== this.props.platform) {
      this.setState({ deviceId: getAppetizeConstants(this.props).device });
    }
  }

  /** Initialize the Appetize SDK client */
  private initAppetizeClient = async (config: AppetizeSdkConfig) => {
    if (!this.client) {
      this.setState({ deviceId: config.device });
      this.props.onPopupUrl?.(this.iframe.current!.src);

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
  };

  /** Clear any active Appetize sessions */
  private endAppetizeSession = async () => {
    if (this.state.session) {
      await this.state.session.end();
      this.setState({
        session: undefined, // Reset the session
        sentQueueInfo: false, // Also reset the queue analytics
      });
    }

    Analytics.getInstance().clearTimer('previewQueue');
  };

  /** Store the session reference and clear possible queue timer */
  private onAppetizeSession = (session: AppetizeSdkSession) => {
    this.setState({ session });

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

  /** Restart Expo Go and reload the Snack, useful in cases of crashes without giving up on queue position */
  private onReloadSnack = createAppetizeAction(this, 'reload', (session) => session.restartApp());
  /** Shake the device, iOS only unfortunately */
  private onShakeDevice = createAppetizeAction(this, 'shake', (session) => session.shake());
  /** Rotate the device to portrait or landscape */
  private onRotateDevice = createAppetizeAction(this, 'rotate', (session) =>
    session.rotate('right')
  );

  /** Use another device instance to preview Snack */
  private onDeviceChange = (deviceId: string) => this.setState({ deviceId });

  render() {
    const { platform, isEmbedded } = this.props;
    const { session, deviceId, deviceControlState } = this.state;

    const deviceControlDisabled = !session || !!deviceControlState;

    return (
      <>
        <div className={css(isEmbedded ? styles.containerEmbedded : styles.container)}>
          <iframe
            id="snack-appetize"
            ref={this.iframe}
            className={css(styles.frame, isEmbedded && { padding: '8px 0' })}
          />
        </div>

        {!isEmbedded && (
          <AppetizeDeviceControl>
            <AppetizeDeviceControl.RestartSnack
              onClick={this.onReloadSnack}
              disabled={deviceControlDisabled}
            />
            <AppetizeDeviceControl.ShakeDevice
              onClick={this.onShakeDevice}
              disabled={deviceControlDisabled || platform !== 'ios'}
            />
            <AppetizeDeviceControl.RotateDevice
              onClick={this.onRotateDevice}
              disabled={deviceControlDisabled}
            />
            <AppetizeDeviceControl.SelectDevice
              platform={platform}
              selectedDevice={deviceId}
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

  // Use the following device settings, in order of priority:
  //   1. Custom device settings for embedded instances
  //   2. Device settings from the current state
  //   3. Default device settings from constants
  const device = props.devices?.[props.platform]?.device ?? state.deviceId ?? constants.device;
  const scale = props.devices?.[props.platform]?.scale ?? constants.scale ?? 'auto';

  return {
    ...constants,
    device,
    launchUrl: props.experienceURL,
    params: JSON.stringify(parameters) as any,
    appearance: props.theme,
    deviceColor: props.theme === 'light' ? 'black' : 'white',
    scale,
    orientation: 'portrait',
    centered: 'both',
  };
}

function resolveAppetizePopupUrl(config: AppetizeSdkConfig) {
  const url = new URL(`https://appetize.io/embed/${config.publicKey}`);

  url.searchParams.set('device', config.device);
  url.searchParams.set('launchUrl', config.launchUrl!);
  url.searchParams.set('params', config.params!);
  url.searchParams.set('appearance', config.appearance!);
  url.searchParams.set('deviceColor', config.deviceColor!);
  url.searchParams.set('scale', String(config.scale));
  url.searchParams.set('orientation', config.orientation!);
  url.searchParams.set('centered', config.centered!);

  return url.toString();
}

function createAppetizeAction(
  component: InstanceType<typeof AppetizeFrame>,
  name: string,
  action: (session: AppetizeSdkSession) => Promise<any>
) {
  return () => {
    if (component.state.session && !component.state.deviceControlState) {
      component.setState({ deviceControlState: name });

      // Note(cedric): restart app doesn't resolve at the moment, so add a race condition of 5 sec
      Promise.race([
        action(component.state.session),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]).finally(() => component.setState({ deviceControlState: undefined }));
    }
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    margin: 'auto',
    zIndex: 2,
    padding: 32,
    boxSizing: 'border-box',
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
    width: '100%',
  },
});

import { StyleSheet, css } from 'aphrodite';
import React, { Component, createRef } from 'react';

import { AppetizeDeviceControl } from './AppetizeDeviceControl';
import { SDKVersion } from '../../types';
import Analytics from '../../utils/Analytics';
import { getAppetizeConstants, getAppetizeQueueName } from '../../utils/Appetize';
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

export type AppetizeFontScale = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl' | 'xxxl';

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
  deviceFontScale?: AppetizeFontScale;
  deviceAppearance: 'light' | 'dark';
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
    deviceFontScale: undefined,
    deviceAppearance: this.props.theme,
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

    // If the platform changes, reset the device control state
    if (this.state.deviceId && prevProps.platform !== this.props.platform) {
      this.setState({
        deviceId: getAppetizeConstants(this.props).device,
        deviceFontScale: undefined,
      });
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

    // Apply the font scaling through the session if it's set
    // Note(cedric): we can't provide this when starting the session
    if (this.props.platform === 'android' && this.state.deviceFontScale) {
      this.onFontScaleChange(this.state.deviceFontScale);
    }

    Analytics.getInstance().clearTimer('previewQueue');
  };

  /** Provide telemetry about queue build up */
  private onAppetizeQueue = (queue: AppetizeQueueEventData) => {
    if (!this.state.sentQueueInfo) {
      this.setState({ sentQueueInfo: true });

      Analytics.getInstance().startTimer('previewQueue');
      Analytics.getInstance().logEvent('QUEUED_FOR_PREVIEW', {
        queuePosition: queue.position,
        queueName: getAppetizeQueueName(this.props),
        queuePlatform: this.props.platform,
      });
    }
  };

  /** Restart Expo Go and reload the Snack, useful in cases of crashes without giving up on queue position */
  private onReloadSnack = () =>
    executeAppetizeAction(this, 'reload', (session) => session.restartApp());
  /** Rotate the device to portrait or landscape */
  private onRotateDevice = () =>
    executeAppetizeAction(this, 'rotate', (session) => session.rotate('right'));

  /**
   * Open the dev menu in Expo Go.
   *   - On iOS, this is done by invoking `session.shake` (shake the device)
   *   - On Android, this is done by invoking `adb shell input keyevent 82`
   *
   * @see https://docs.expo.dev/debugging/tools/#developer-menu
   */
  private onOpenDevMenu = () =>
    executeAppetizeAction(this, 'dev-menu', (session, platform) =>
      platform === 'ios' ? session.shake() : session.adbShellCommand('input keyevent 82')
    );

  /**
   * Toggle the device appearance from light to dark or dark to light.
   *   - on iOS, this is done through `launchArgs` with `-AppleInterfaceStyle Dark`
   *   - on Android, this is done through `cmd uimode night yes|no`
   */
  private onToggleDeviceAppearance = () => {
    // We need to perform some side effects to change the device appearance
    // eslint-disable-next-line react/no-access-state-in-setstate
    const nextAppearance = this.state.deviceAppearance === 'light' ? 'dark' : 'light';

    this.setState({ deviceAppearance: nextAppearance });

    if (this.props.platform === 'ios') {
      const hasSession = !!this.state.session;
      const config = resolveAppetizeConfig(this.props, {
        ...this.state,
        deviceAppearance: nextAppearance,
      });

      return this.resetAppetizeClient(config).then(() => hasSession && this.client?.startSession());
    }

    return executeAppetizeAction(this, 'appearance', (session) =>
      session.adbShellCommand(`cmd uimode night ${nextAppearance === 'dark' ? 'yes' : 'no'}`)
    );
  };
  /**
   * Change the device font scaling.
   *   - On iOS, this is done through `launchArgs` with `-UIPreferredContentSizeCategoryName`
   *   - On Android, this is done through `adb shell settings put system font_scale` and restarting the app
   */
  private onFontScaleChange = (deviceFontScale?: AppetizeFontScale) => {
    this.setState({ deviceFontScale });

    // We need to restart the session if it was active, to apply the new launch args
    if (this.props.platform === 'ios') {
      const hasSession = !!this.state.session;
      const config = resolveAppetizeConfig(this.props, { ...this.state, deviceFontScale });

      return this.resetAppetizeClient(config).then(() => hasSession && this.client?.startSession());
    }

    // For Android, we can just modify the session directly
    return executeAppetizeAction(this, 'font-scale', (session, platform) => {
      const fontScale = deviceFontScale
        ? resolveAppetizeFontScale({ platform }, { deviceFontScale })
        : '1.0';

      return session
        .adbShellCommand(`settings put system font_scale ${fontScale}`)
        .then(() => session.restartApp());
    });
  };

  /** Use another device instance to preview Snack */
  private onDeviceChange = (deviceId: string) => this.setState({ deviceId });

  render() {
    const { platform, isEmbedded } = this.props;
    const { session, deviceId, deviceAppearance, deviceFontScale, deviceControlState } = this.state;

    return (
      <>
        <div className={css(isEmbedded ? styles.containerEmbedded : styles.container)}>
          <iframe
            id="snack-appetize"
            ref={this.iframe}
            className={css(styles.frame, isEmbedded && styles.frameEmbedded)}
          />
        </div>

        {!isEmbedded && (
          <AppetizeDeviceControl>
            <AppetizeDeviceControl.Group>
              <AppetizeDeviceControl.RestartSnack
                onClick={this.onReloadSnack}
                disabled={!session || !!deviceControlState}
              />
              <AppetizeDeviceControl.OpenDevMenu
                onClick={this.onOpenDevMenu}
                disabled={!session || !!deviceControlState}
              />
              <AppetizeDeviceControl.RotateDevice
                onClick={this.onRotateDevice}
                disabled={!session || !!deviceControlState}
              />
            </AppetizeDeviceControl.Group>
            <AppetizeDeviceControl.Group>
              <AppetizeDeviceControl.DeviceAppearance
                onClick={this.onToggleDeviceAppearance}
                disabled={!!deviceControlState}
                appearance={deviceAppearance}
              />
              <AppetizeDeviceControl.SelectFontScale
                disabled={!!deviceControlState}
                selectedFontScale={deviceFontScale}
                onSelectFontScale={this.onFontScaleChange}
              />
              <AppetizeDeviceControl.SelectDevice
                platform={platform}
                selectedDevice={deviceId}
                onSelectDevice={this.onDeviceChange}
              />
            </AppetizeDeviceControl.Group>
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
  const platform = props.platform;
  const constants = getAppetizeConstants(props);
  const parameters = {
    EXDevMenuDisableAutoLaunch: true,
    EXKernelDisableNuxDefaultsKey: true,
  };

  const launchArgs: string[] = [];

  if (platform === 'ios') {
    // See: https://docs.appetize.io/sample-use-cases/test-accessibility-font-sizes#ios
    if (state.deviceFontScale) {
      launchArgs.push(
        '-UIPreferredContentSizeCategoryName',
        resolveAppetizeFontScale(props, state)
      );
    }
  }

  // Use the following device settings, in order of priority:
  //   1. Custom device settings for embedded instances
  //   2. Device settings from the current state
  //   3. Default device settings from constants
  const device = props.devices?.[platform]?.device ?? state.deviceId ?? constants.device;
  const deviceScale = props.devices?.[platform]?.scale ?? constants.scale ?? 'auto';

  const theme = state.deviceAppearance ?? props.theme;

  return {
    ...constants,
    device,
    launchUrl: props.experienceURL,
    launchArgs: launchArgs.length ? launchArgs : undefined,
    params: JSON.stringify(parameters) as any,
    appearance: theme,
    deviceColor: props.theme === 'light' ? 'black' : 'white',
    scale: deviceScale,
    orientation: 'portrait',
    centered: 'both',
  };
}

function resolveAppetizePopupUrl(config: AppetizeSdkConfig) {
  const url = new URL(`https://appetize.io/embed/${config.publicKey}`);

  url.searchParams.set('device', config.device);
  url.searchParams.set('launchUrl', config.launchUrl!);

  if (config.launchArgs) url.searchParams.set('launchArgs', config.launchArgs.join(' '));
  if (config.params) url.searchParams.set('params', config.params);
  if (config.appearance) url.searchParams.set('appearance', config.appearance);
  if (config.deviceColor) url.searchParams.set('deviceColor', config.deviceColor);
  if (config.scale) url.searchParams.set('scale', String(config.scale));
  if (config.orientation) url.searchParams.set('orientation', config.orientation);
  if (config.centered) url.searchParams.set('centered', config.centered);

  return url.toString();
}

const APPETIZE_FONT_SCALES: Record<AppetizeFontScale, Record<'android' | 'ios', string>> = {
  xs: { android: '0.70', ios: 'UICTContentSizeCategoryXS' },
  s: { android: '0.85', ios: 'UICTContentSizeCategoryS' },
  m: { android: '1.00', ios: 'UICTContentSizeCategoryM' },
  l: { android: '1.15', ios: 'UICTContentSizeCategoryL' },
  xl: { android: '1.30', ios: 'UICTContentSizeCategoryXL' },
  xxl: { android: '1.45', ios: 'UICTContentSizeCategoryXXL' },
  xxxl: { android: '1.60', ios: 'UICTContentSizeCategoryXXXL' },
};

function resolveAppetizeFontScale(
  props: Pick<AppetizeFrameProps, 'platform'>,
  state: Pick<AppetizeFrameState, 'deviceFontScale'>
) {
  return APPETIZE_FONT_SCALES[state.deviceFontScale ?? 'm'][props.platform];
}

function executeAppetizeAction(
  component: InstanceType<typeof AppetizeFrame>,
  name: string,
  action: (session: AppetizeSdkSession, platform: AppetizeFrameProps['platform']) => Promise<any>
) {
  if (component.state.session && !component.state.deviceControlState) {
    component.setState({ deviceControlState: name });

    // Note(cedric): restart app doesn't resolve at the moment, so add a race condition of 5 sec
    return Promise.race([
      action(component.state.session, component.props.platform),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]).finally(() => component.setState({ deviceControlState: undefined }));
  }

  return null;
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
  frameEmbedded: {
    padding: '8px 0',
  },
});

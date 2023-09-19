import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import * as React from 'react';

import AppetizeFrame, { AppetizeDevices } from './AppetizeFrame';
import MyDeviceFrame from './MyDeviceFrame';
import WebFrame from './WebFrame';
import constants from '../../configs/constants';
import { SDKVersion, Device, Platform } from '../../types';
import * as PlatformOptions from '../../utils/PlatformOptions';
import type { EditorModal } from '../EditorViewProps';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import { c } from '../ThemeProvider';
import ToggleButtons from '../shared/ToggleButtons';

type Props = {
  className?: string;
  width: number;
  connectedDevices: Device[];
  experienceURL: string;
  experienceName: string;
  name: string;
  onAppLaunch?: () => void;
  onChangePlatform: (platform: Platform) => void;
  onShowModal: (modal: EditorModal) => void;
  onReloadSnack: () => void;
  onSendCode: () => void;
  onToggleSendCode: () => void;
  payerCode?: string;
  platform: Platform;
  platformOptions: PlatformOptions.PlatformOption[];
  previewRef: React.MutableRefObject<Window | null>;
  previewURL: string;
  devices?: AppetizeDevices;
  isEmbedded?: boolean;
  sdkVersion: SDKVersion;
  sendCodeOnChangeEnabled: boolean;
  theme: ThemeName;
};

type State = {
  popupUrl?: string;
  isRendered: boolean;
  isPopupOpen: boolean;
};

const VISIBILITY_MEDIA_QUERY = `(min-width: ${constants.preview.minWidth}px)`;
const VISIBILITY_MEDIA_QUERY_EMBEDDED = `(min-width: ${constants.preview.embeddedMinWidth}px)`;

class DevicePreview extends React.PureComponent<Props, State> {
  state: State = {
    isRendered: false,
    isPopupOpen: false,
  };

  componentDidMount() {
    this.mql = window.matchMedia(
      this.props.isEmbedded ? VISIBILITY_MEDIA_QUERY_EMBEDDED : VISIBILITY_MEDIA_QUERY
    );
    this.mql.addListener(this.handleMediaQuery);
    this.handleMediaQuery(this.mql);
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (this.state.isPopupOpen && prevState.popupUrl !== this.state.popupUrl) {
      this.handlePopup();
    }
  }

  componentWillUnmount() {
    clearInterval(this.popupInterval);

    this.mql?.removeListener(this.handleMediaQuery);

    this.popup?.close();
  }

  private handleMediaQuery = (mql: any) =>
    this.setState({
      isRendered: mql.matches,
    });

  private handlePopup = () => {
    this.popup = window.open(this.state.popupUrl, 'snack-device', 'width=327,height=668');

    if (this.popup?.closed) {
      return;
    }

    this.setState(
      {
        isPopupOpen: true,
      },
      () => {
        this.props.previewRef.current = this.popup;
      }
    );

    clearInterval(this.popupInterval);

    this.popupInterval = setInterval(() => {
      if (!this.popup || this.popup.closed) {
        clearInterval(this.popupInterval);
        this.popup = null;
        this.setState({
          isPopupOpen: false,
        });
      }
    }, 500);
  };

  private handlePopupUrl = (url: string) => this.setState({ popupUrl: url });

  private popupInterval: any;
  private popup: Window | null = null;
  private mql: MediaQueryList | null = null;

  render() {
    const { isPopupOpen, isRendered } = this.state;

    if (!isRendered || isPopupOpen) {
      return null;
    }

    const {
      className,
      width,
      connectedDevices,
      experienceURL,
      experienceName,
      name,
      onAppLaunch,
      onChangePlatform,
      onShowModal,
      onReloadSnack,
      onSendCode,
      onToggleSendCode,
      payerCode,
      platform,
      platformOptions,
      previewRef,
      previewURL,
      isEmbedded,
      sdkVersion,
      sendCodeOnChangeEnabled,
      theme,
      devices,
    } = this.props;
    return (
      <div
        className={classnames(css(isEmbedded ? styles.embedded : styles.container), className)}
        style={{ width }}
      >
        {isEmbedded ? null : (
          <div className={css(styles.header)}>
            <ToggleButtons
              options={platformOptions}
              value={platform}
              onValueChange={onChangePlatform}
              className={css(styles.toggleButtons)}
            />
            <button
              className={css(
                styles.popupButton,
                theme === 'dark' ? styles.popupButtonDark : styles.popupButtonLight,
                platform === 'mydevice' && styles.popupButtonHidden
              )}
              disabled={platform === 'mydevice'}
              onClick={this.handlePopup}
            />
          </div>
        )}
        {platform === 'web' && (
          <WebFrame
            previewRef={previewRef}
            previewURL={previewURL}
            onPopupUrl={this.handlePopupUrl}
          />
        )}
        {platform === 'mydevice' && (
          <MyDeviceFrame
            width={width}
            connectedDevices={connectedDevices}
            experienceURL={experienceURL}
            experienceName={experienceName}
            name={name}
            onReloadSnack={onReloadSnack}
            onSendCode={onSendCode}
            onToggleSendCode={onToggleSendCode}
            isEmbedded={isEmbedded}
            sdkVersion={sdkVersion}
            sendCodeOnChangeEnabled={sendCodeOnChangeEnabled}
          />
        )}
        {(platform === 'ios' || platform === 'android') && (
          <AppetizeFrame
            width={width}
            sdkVersion={sdkVersion}
            experienceURL={experienceURL}
            platform={platform}
            isEmbedded={isEmbedded}
            payerCode={payerCode}
            isPopupOpen={isPopupOpen}
            onPopupUrl={this.handlePopupUrl}
            onShowModal={onShowModal}
            onAppLaunch={onAppLaunch}
            devices={devices}
          />
        )}
      </div>
    );
  }
}

export default withThemeName(DevicePreview);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    maxWidth: '50%',
    overflowX: 'hidden',
    overflowY: 'auto',
    display: 'none',
    flexDirection: 'column',

    [`@media ${VISIBILITY_MEDIA_QUERY}`]: {
      display: 'flex',
    },
  },
  embedded: {
    position: 'relative',
    maxWidth: '50%',
    overflowX: 'hidden',
    overflowY: 'auto',
    display: 'none',
    flexDirection: 'column',
    [`@media ${VISIBILITY_MEDIA_QUERY_EMBEDDED}`]: {
      display: 'flex',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 0',
    borderBottom: `1px solid ${c('border-editor')}`,
  },
  toggleButtons: {
    zIndex: 3,
  },
  popupButton: {
    position: 'absolute',
    right: 0,
    zIndex: 2,
    appearance: 'none',
    height: 48,
    width: 48,
    padding: 16,
    margin: 0,
    border: 0,
    outline: 0,
    opacity: 0.8,
    backgroundSize: 16,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'transparent',
    transition: '.2s',

    ':hover': {
      opacity: 1,
    },
  },
  popupButtonDark: {
    backgroundImage: `url(${require('../../assets/open-link-icon-light.png')})`,
  },
  popupButtonLight: {
    backgroundImage: `url(${require('../../assets/open-link-icon.png')})`,
  },
  popupButtonHidden: {
    opacity: 0,
    ':hover': {
      opacity: 0,
    },
  },
});

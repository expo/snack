import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

import { getLoginHref } from '../../auth/login';
import withAuth, { AuthProps } from '../../auth/withAuth';
import { Device, SDKVersion } from '../../types';
import DeviceIDModal from '../DeviceInstructions/DeviceIDModal';
import { Shortcuts } from '../KeyboardShortcuts';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import QRCode from '../QRCode';
import { c, s } from '../ThemeProvider';
import Banner from '../shared/Banner';
import IconButton from '../shared/IconButton';
import MenuButton from '../shared/MenuButton';
import ShortcutLabel from '../shared/ShortcutLabel';
import ToggleSwitch from '../shared/ToggleSwitch';
import RecentlyInDevelopmentPreview from './RecentlyInDevelopmentPreview';

type Props = AuthProps & {
  width: number;
  connectedDevices: Device[];
  deviceId: string | undefined;
  experienceURL: string;
  experienceName: string;
  name: string;
  onToggleSendCode: () => void;
  onSendCode: () => void;
  onReloadSnack: () => void;
  sdkVersion: SDKVersion;
  isEmbedded?: boolean;
  sendCodeOnChangeEnabled: boolean;
  setDeviceId: (deviceId: string) => void;
  theme: ThemeName;
};

type State = {
  connectedDevices: Device[];
  visibleModal: 'none' | 'deviceid';
  copiedToClipboard: boolean;
};

class MyDeviceFrame extends React.PureComponent<Props, State> {
  state: State = {
    connectedDevices: [
      // TODO: Remove this later, for testing only
      /* { id: '4562-fg34', name: 'Heins iPhone XR', platform: 'ios' },
      { id: 'fg34-4562', name: 'Android Emulator API 21', platform: 'android' },
      { id: 'fg34-4563', name: 'Web emulator', platform: 'web' },
      { id: 'fg34-4564', name: 'Errr', platform: 'unknown' }, */
    ],
    visibleModal: 'none',
    copiedToClipboard: false,
  };

  static getDerivedStateFromProps(props: Props) {
    const { connectedDevices } = props;
    return {
      connectedDevices,
    };
  }

  render() {
    const { experienceURL, deviceId, isEmbedded, width } = this.props;
    const { connectedDevices, visibleModal, copiedToClipboard } = this.state;
    const isConnected = connectedDevices.length >= 1;

    return (
      <div className={css(styles.container)} style={{ width }}>
        <Banner visible={copiedToClipboard}>Copied to clipboard!</Banner>
        <div className={css(styles.frame)}>
          <h3 className={css(styles.title)}>
            Download{' '}
            <a
              className={css(styles.link)}
              href={`${process.env.SERVER_URL}/client`}
              target="blank">
              Expo Go
            </a>{' '}
            and scan
            <br />
            the QR code to get started.
          </h3>
          <div className={css(styles.qrcode)} style={{ width: width - 20, height: width - 20 }}>
            <QRCode size={width - 40} experienceURL={experienceURL} />
          </div>
          {!isEmbedded && (
            <CopyToClipboard text={experienceURL} onCopy={this._handleCopyToClipboard}>
              <div className={css(styles.experienceLink)}>{experienceURL}</div>
            </CopyToClipboard>
          )}
          <div className={css(styles.flex)} />
          <div className={css(styles.connectedDevices)}>
            <div
              className={css(
                styles.connectedDevicesHeader,
                isEmbedded ? styles.connectedDevicesEmbedded : undefined
              )}>
              <div className={css(styles.connectedDevicesTitle)}>
                <h3>Connected devices</h3>
                <span className={css(styles.connectedDevicesCount)}>{connectedDevices.length}</span>
              </div>
              <div className={css(styles.popupButton)}>
                <MenuButton
                  icon={require('../../assets/settings-icon.png')}
                  content={this.renderPopupMenu()}
                />
              </div>
            </div>
            {!isConnected && this.renderNoConnectedDevices()}
            {connectedDevices.map(this.renderConnectedDevice)}
          </div>
          <DeviceIDModal
            visible={visibleModal === 'deviceid'}
            deviceId={deviceId}
            setDeviceId={this.handleSetDeviceId}
            onDismiss={this.handleDismissModal}
          />
        </div>
      </div>
    );
  }

  private handleDismissModal = () => {
    this.setState({
      visibleModal: 'none',
    });
  };

  private handleSetDeviceId = async (deviceId: string) => {
    const { setDeviceId } = this.props;
    await setDeviceId(deviceId);
    this.setState({
      visibleModal: 'none',
    });
  };

  private _handleCopyToClipboard = () => {
    this.setState({ copiedToClipboard: true });
    setTimeout(() => this.setState(() => ({ copiedToClipboard: false })), 1000);
  };

  private renderPopupMenu() {
    const { sendCodeOnChangeEnabled, onToggleSendCode, onSendCode, onReloadSnack } = this.props;
    const { connectedDevices } = this.state;
    const appText = connectedDevices.length > 1 ? 'apps' : 'app';
    const deviceText = connectedDevices.length > 1 ? 'devices' : 'device';
    const isConnected = connectedDevices.length > 0;
    return (
      <div className={css(styles.popupContainer)}>
        <div className={css(styles.popupRow)}>
          <IconButton
            small
            title="Set ID of your device"
            label="Set Device ID"
            onClick={this.onClickDeviceId}
          />
        </div>
        {isConnected && (
          <ToggleSwitch
            checked={sendCodeOnChangeEnabled}
            onChange={onToggleSendCode}
            label="Update as you type"
          />
        )}
        {isConnected && (
          <div className={css(styles.popupRow)}>
            <IconButton
              small
              title={`Update changes on connected ${deviceText}`}
              label="Update now"
              onClick={onSendCode}>
              <svg width="14px" height="17px" viewBox="0 0 14 17">
                <path
                  transform="translate(-5.000000, -3.000000)"
                  d="M9,16 L15,16 L15,10 L19,10 L12,3 L5,10 L9,10 L9,16 Z M5,18 L19,18 L19,20 L5,20 L5,18 Z"
                />
              </svg>
            </IconButton>
            <ShortcutLabel combo={Shortcuts.update.combo} />
          </div>
        )}
        {isConnected && (
          <div className={css(styles.popupRow)}>
            <IconButton
              small
              title={`Reload ${appText} on connected ${deviceText}`}
              label={`Reload ${appText}`}
              onClick={onReloadSnack}>
              <svg width="16px" height="20px" viewBox="0 0 16 20">
                <path d="M8,3.5 L8,0 L3,5 L8,10 L8,5.5 C11.314,5.5 14,8.186 14,11.5 C14,14.814 11.314,17.5 8,17.5 C4.686,17.5 2,14.814 2,11.5 L0,11.5 C0,15.918 3.582,19.5 8,19.5 C12.418,19.5 16,15.918 16,11.5 C16,7.082 12.418,3.5 8,3.5" />
              </svg>
            </IconButton>
          </div>
        )}
      </div>
    );
  }

  onClickDeviceId = () => {
    this.setState({
      visibleModal: 'deviceid',
    });
  };

  private renderNoConnectedDevices() {
    const { viewer, deviceId, experienceURL, experienceName, isEmbedded } = this.props;

    if (viewer || deviceId) {
      return (
        <>
          {viewer ? (
            <p className={css(styles.notConnectedText)}>
              This Snack is visible on the "Projects" tab of your signed in Expo Go app
              {deviceId ? ', and on device ' : '. Or set a '}
              <button onClick={this.onClickDeviceId} className={css(styles.link)}>
                {deviceId ? (
                  <span className={css(styles.deviceIDText)}>{deviceId}</span>
                ) : (
                  'Device ID'
                )}
              </button>
              .
            </p>
          ) : (
            <p className={css(styles.notConnectedText)}>
              This Snack is visible on the "Projects" tab of Expo Go with device ID
              <span> </span>
              <button onClick={this.onClickDeviceId} className={css(styles.link)}>
                <span className={css(styles.deviceIDText)}>{deviceId}</span>
              </button>
              .
            </p>
          )}
          <RecentlyInDevelopmentPreview name={experienceName} experienceURL={experienceURL} />
        </>
      );
    } else {
      return (
        <p className={css(styles.notConnectedText)}>
          <a
            href={isEmbedded ? `${process.env.SERVER_URL}/login` : getLoginHref()}
            target={isEmbedded ? '_blank' : undefined}
            className={css(styles.link)}>
            Log in
          </a>
          <span> </span>or set a<span> </span>
          <button onClick={this.onClickDeviceId} className={css(styles.link)}>
            Device ID
          </button>
          <span> </span>to open this Snack from Expo Go on your device or simulator.
        </p>
      );
    }
  }

  private renderConnectedDevice = (device: Device) => {
    const { id, name, status } = device;
    return (
      <div key={id} className={css(styles.deviceContainer)}>
        {this.renderDevicePlatformIcon(device)}
        <div className={css(styles.deviceContent)}>
          <h4 className={css(styles.deviceTitle)}>{name}</h4>
          <p className={css(styles.deviceSubtitle)}>
            {status === 'connected' ? 'Connected' : 'Disconnected'}
          </p>
        </div>
      </div>
    );
  };

  private renderDevicePlatformIcon(device: Device) {
    const { platform } = device;
    switch (platform) {
      case 'android':
        return (
          <svg className={css(styles.deviceIcon)} width="16px" height="20px" viewBox="0 0 16 20">
            <path
              transform="translate(-16.000000, -146.000000)"
              d="M19.2,160.325197 C19.2,160.762881 19.56,161.120986 20,161.120986 L20.8,161.120986 L20.8,163.906247 C20.8,164.566752 21.336,165.099931 22,165.099931 C22.664,165.099931 23.2,164.566752 23.2,163.906247 L23.2,161.120986 L24.8,161.120986 L24.8,163.906247 C24.8,164.566752 25.336,165.099931 26,165.099931 C26.664,165.099931 27.2,164.566752 27.2,163.906247 L27.2,161.120986 L28,161.120986 C28.44,161.120986 28.8,160.762881 28.8,160.325197 L28.8,152.367307 L19.2,152.367307 L19.2,160.325197 L19.2,160.325197 Z M17.2,152.367307 C16.536,152.367307 16,152.900485 16,153.56099 L16,159.131513 C16,159.792018 16.536,160.325197 17.2,160.325197 C17.864,160.325197 18.4,159.792018 18.4,159.131513 L18.4,153.56099 C18.4,152.900485 17.864,152.367307 17.2,152.367307 L17.2,152.367307 Z M30.8,152.367307 C30.136,152.367307 29.6,152.900485 29.6,153.56099 L29.6,159.131513 C29.6,159.792018 30.136,160.325197 30.8,160.325197 C31.464,160.325197 32,159.792018 32,159.131513 L32,153.56099 C32,152.900485 31.464,152.367307 30.8,152.367307 L30.8,152.367307 Z M26.824,147.719899 L27.868,146.681394 C28.024,146.526215 28.024,146.275542 27.868,146.120363 C27.712,145.965184 27.46,145.965184 27.304,146.120363 L26.12,147.294152 C25.48,146.979815 24.764,146.796784 24,146.796784 C23.232,146.796784 22.512,146.979815 21.868,147.298131 L20.68,146.116384 C20.524,145.961205 20.272,145.961205 20.116,146.116384 C19.96,146.271563 19.96,146.522237 20.116,146.677415 L21.164,147.719899 C19.976,148.591288 19.2,149.991877 19.2,151.571518 L28.8,151.571518 C28.8,149.987898 28.02,148.587309 26.824,147.719899 L26.824,147.719899 Z M26,149.978945 C26.2209139,149.978945 26.4,149.800802 26.4,149.581051 C26.4,149.361299 26.2209139,149.183156 26,149.183156 C25.7790861,149.183156 25.6,149.361299 25.6,149.581051 C25.6,149.800802 25.7790861,149.978945 26,149.978945 Z M22,149.978945 C22.2209139,149.978945 22.4,149.800802 22.4,149.581051 C22.4,149.361299 22.2209139,149.183156 22,149.183156 C21.7790861,149.183156 21.6,149.361299 21.6,149.581051 C21.6,149.800802 21.7790861,149.978945 22,149.978945 Z"
            />
          </svg>
        );
      case 'web':
        return (
          <svg className={css(styles.deviceIcon)} width="18px" height="18px" viewBox="0 0 18 18">
            <g strokeWidth="1" fill="none" stroke={c('selected')}>
              <circle cx="9" cy="9" r="8" />
              <rect x="2" y="11" width="14" height="0.5" />
              <rect x="2" y="6" width="14" height="0.5" />
              <ellipse cx="9" cy="9" rx="3" ry="8" />
            </g>
          </svg>
        );
      case 'ios':
      default:
        return (
          <svg className={css(styles.deviceIcon)} width="16px" height="16px" viewBox="0 0 16 16">
            <path d="M5,0 L11,0 C13.7614237,-5.07265313e-16 16,2.23857625 16,5 L16,11 C16,13.7614237 13.7614237,16 11,16 L5,16 C2.23857625,16 3.38176876e-16,13.7614237 0,11 L0,5 C-3.38176876e-16,2.23857625 2.23857625,5.07265313e-16 5,0 Z M2.79296875,11 L3.5,11 L3.5,6.890625 L2.79296875,6.890625 L2.79296875,11 Z M2.64453125,5.625 C2.64453125,5.90625 2.859375,6.11328125 3.140625,6.11328125 C3.4375,6.11328125 3.65234375,5.90625 3.65234375,5.625 C3.65234375,5.33984375 3.4375,5.1328125 3.140625,5.1328125 C2.859375,5.1328125 2.64453125,5.33984375 2.64453125,5.625 Z M9.20385423,8.71875 L9.20385423,7.94921875 C9.20385423,6.4375 8.36401048,5.55859375 7.05541673,5.55859375 C5.74682298,5.55859375 4.90697923,6.43359375 4.90697923,7.94921875 L4.90697923,8.71875 C4.90697923,10.2304688 5.74682298,11.109375 7.05541673,11.109375 C8.36401048,11.109375 9.20385423,10.2304688 9.20385423,8.71875 Z M10.1616147,9.64453125 C10.2358335,10.5039062 10.962396,11.109375 12.0913022,11.109375 C13.321771,11.109375 14.0913022,10.4726562 14.0913022,9.50390625 C14.0913022,8.7265625 13.634271,8.2890625 12.7006772,8.046875 L11.790521,7.80859375 C11.3022397,7.6875 11.040521,7.4296875 11.040521,7.0546875 C11.040521,6.53515625 11.4897397,6.1796875 12.1616147,6.1796875 C12.7827085,6.1796875 13.2045835,6.4765625 13.3022397,6.9453125 L14.024896,6.9453125 C13.9428647,6.1328125 13.228021,5.54296875 12.1733335,5.54296875 C11.087396,5.54296875 10.3100522,6.18359375 10.3100522,7.08984375 C10.3100522,7.8046875 10.7709897,8.29296875 11.571771,8.5 L12.4975522,8.73828125 C13.0952085,8.890625 13.3647397,9.13671875 13.3647397,9.5625 C13.3647397,10.1171875 12.9077085,10.4726562 12.165521,10.4726562 C11.4702085,10.4726562 10.9897397,10.1484375 10.8881772,9.64453125 L10.1616147,9.64453125 Z M8.48119798,7.94921875 L8.48119798,8.72265625 C8.48119798,9.89453125 7.86401048,10.4648438 7.05541673,10.4648438 C6.24291673,10.4648438 5.62963548,9.89453125 5.62963548,8.72265625 L5.62963548,7.94921875 C5.62963548,6.7734375 6.24291673,6.203125 7.05541673,6.203125 C7.86401048,6.203125 8.48119798,6.7734375 8.48119798,7.94921875 Z" />
          </svg>
        );
    }
  }
}

export default withThemeName(withAuth(MyDeviceFrame));

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  frame: {
    display: 'flex',
    flex: 1,
    width: '100%',
    flexDirection: 'column',
  },
  title: {
    textAlign: 'center',
  },
  qrcode: {
    backgroundColor: c('content', 'light'),
    boxShadow: s('small'),
    borderRadius: 4,
    padding: 10,
    marginLeft: 10,
  },
  experienceLink: {
    cursor: 'pointer',
    marginTop: '0.5em',
    fontSize: 13,
    opacity: process.env.NODE_ENV === 'production' ? 0 : 0.75,
    padding: '0 12px',
    textAlign: 'center',
    ':hover': {
      opacity: 0.75,
      transition: '.5s',
    },
  },
  flex: {
    flex: 1,
  },
  connectedDevices: {
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
  },
  connectedDevicesHeader: {
    display: 'flex',
    flexDirection: 'row',
    flexShrink: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 12px',
    borderTop: `1px solid ${c('border')}`,
  },
  connectedDevicesEmbedded: {
    border: 'none',
  },
  connectedDevicesTitle: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedDevicesCount: {
    marginLeft: 10,
    height: 20,
    minWidth: 20,
    borderRadius: '50%',
    backgroundColor: c('text'),
    color: c('background'),
    opacity: 0.5,
    textAlign: 'center',
  },
  popupButton: {
    zIndex: 1,
  },
  popupContainer: {},
  popupRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '0 12px',
  },
  notConnectedText: {
    opacity: 0.7,
    marginLeft: 12,
    marginRight: 12,
    marginTop: 0,
  },
  deviceIDText: {
    fontSize: 11,
    fontFamily: 'var(--font-monospace)',
  },
  deviceContainer: {
    height: 60,
    display: 'flex',
    padding: '0 12px',
    cursor: 'pointer',
    color: 'inherit',
    textDecoration: 'none',
    flexDirection: 'row',
    alignItems: 'center',
    ':hover': {
      backgroundColor: c('hover'),
    },
  },
  deviceIcon: {
    height: 36,
    width: 36,
    marginRight: 16,
    fill: c('selected'),
  },
  deviceContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 0,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  deviceSubtitle: {
    fontSize: 12,
    margin: 0,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    opacity: 0.5,
  },
  link: {
    color: c('text'),
    appearance: 'none',
    background: 'none',
    border: 0,
    margin: 0,
    padding: 0,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
});

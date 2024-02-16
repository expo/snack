import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { getLoginHref } from '../../auth/login';
import withAuth, { AuthProps } from '../../auth/withAuth';
import { SDKVersion, Viewer } from '../../types';
import Analytics from '../../utils/Analytics';
import constructAppetizeURL, { getAppetizeConfig } from '../../utils/constructAppetizeURL';
import type { EditorModal } from '../EditorViewProps';
import withThemeName, { ThemeName } from '../Preferences/withThemeName';
import { c } from '../ThemeProvider';
import Button from '../shared/Button';
import ButtonLink from '../shared/ButtonLink';

/** @see https://docs.appetize.io/core-features/playback-options */
export type AppetizeDeviceAndroid = 'none' | string;
/** @see https://docs.appetize.io/core-features/playback-options */
export type AppetizeDeviceIos = 'none' | string;

export type AppetizeDevices = {
  _showFrame: boolean;
  android?: { device?: AppetizeDeviceAndroid; scale?: number };
  ios?: { device?: AppetizeDeviceIos; scale?: number };
};

type Props = AuthProps & {
  width: number;
  sdkVersion: SDKVersion;
  experienceURL: string;
  platform: 'android' | 'ios';
  isEmbedded?: boolean;
  payerCode?: string;
  isPopupOpen: boolean;
  onPopupUrl: (url: string) => void;
  onShowModal: (modal: EditorModal) => void;
  onAppLaunch?: () => void;
  theme: ThemeName;
  devices?: AppetizeDevices;
};

type AppetizeStatus =
  | { type: 'unknown' }
  | { type: 'requested' }
  | { type: 'queued'; position: number | undefined }
  | { type: 'connecting' }
  | { type: 'launch' }
  | { type: 'timeout' };

type PayerCodeFormStatus =
  | { type: 'open'; value: string }
  | { type: 'submitted' }
  | { type: 'closed' };

type State = {
  appetizeStatus: AppetizeStatus;
  appetizeURL: string;
  autoplay: boolean;
  payerCodeFormStatus: PayerCodeFormStatus;
  platform: 'ios' | 'android';
  sdkVersion: SDKVersion;
  theme: ThemeName;
  viewer: Viewer | undefined;
};

class AppetizeFrame extends React.PureComponent<Props, State> {
  private static getAppetizeURL(props: Props, autoplay: boolean) {
    const { experienceURL, platform, isEmbedded, payerCode, theme, devices, sdkVersion } = props;

    return constructAppetizeURL({
      type: isEmbedded ? 'embedded' : 'website',
      experienceURL,
      autoplay,
      platform,
      previewQueue: isEmbedded ? 'secondary' : 'main',
      deviceColor: theme === 'dark' ? 'white' : 'black',
      payerCode,
      devices,
      sdkVersion,
    });
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    // Reset appetize status when we change platform or sdk version or user logs in
    if (
      props.platform !== state.platform ||
      props.sdkVersion !== state.sdkVersion ||
      props.theme !== state.theme
    ) {
      const autoplay = state.payerCodeFormStatus.type === 'submitted';
      return {
        appetizeStatus: { type: 'unknown' },
        appetizeURL: AppetizeFrame.getAppetizeURL(props, autoplay),
        autoplay,
        payerCodeFormStatus: { type: 'closed' },
        platform: props.platform,
        sdkVersion: props.sdkVersion,
        theme: props.theme,
        viewer: props.viewer,
      };
    }

    return null;
  }

  state: State = {
    appetizeStatus: { type: 'unknown' },
    appetizeURL: AppetizeFrame.getAppetizeURL(this.props, false),
    autoplay: false,
    payerCodeFormStatus: { type: 'closed' },
    platform: this.props.platform,
    sdkVersion: this.props.sdkVersion,
    theme: this.props.theme,
    viewer: this.props.viewer,
  };

  componentDidMount() {
    window.addEventListener('message', this.handlePostMessage);
    window.addEventListener('unload', this.endSession);

    this.props.onPopupUrl(this.state.appetizeURL);
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (
      prevState.appetizeStatus !== this.state.appetizeStatus &&
      this.state.appetizeStatus.type === 'requested'
    ) {
      this.handleLaunchRequest();
    } else if (this.state.appetizeURL !== prevState.appetizeURL) {
      this.props.onPopupUrl(this.state.appetizeURL);
    }
  }

  componentWillUnmount() {
    this.endSession();

    window.removeEventListener('message', this.handlePostMessage);
    window.removeEventListener('unload', this.endSession);
  }

  private handleLaunchRequest = () => {
    Analytics.getInstance().logEvent('RAN_EMULATOR');
  };

  private handlePayerCodeLink = () => {
    this.setState({
      payerCodeFormStatus: { type: 'open', value: '' },
    });
    Analytics.getInstance().logEvent('REQUESTED_APPETIZE_CODE', {}, 'previewQueue');
  };

  private handlePostMessage = ({ origin, data }: MessageEvent) => {
    if (origin === getAppetizeConfig(this.props.sdkVersion).url) {
      let status: AppetizeStatus | undefined;

      console.log(data);

      switch (data) {
        case 'sessionRequested':
          status = { type: 'requested' };
          break;
        case 'sessionConnecting':
          status = { type: 'connecting' };
          break;
        case 'appLaunch':
          status = { type: 'launch' };

          this.props.onAppLaunch?.();

          if (this.state.appetizeStatus.type === 'queued') {
            Analytics.getInstance().logEvent('APP_LAUNCHED', {}, 'previewQueue');
          }
          Analytics.getInstance().clearTimer('previewQueue');
          break;
        case 'timeoutWarning':
          status = { type: 'timeout' };
          break;
        case 'sessionEnded':
          status = { type: 'unknown' };
          Analytics.getInstance().clearTimer('previewQueue');
          break;
        case 'accountQueued':
          status = { type: 'queued', position: undefined };
          break;
        // Disabled, needs to be redesigned
        // case 'concurrentQueued':
        //   status = { type: 'queued', position: data.position };
        //   break;
        // case 'concurrentQueuedPosition':
        //   status = { type: 'queued', position: data.position };
        //   break;
        default:
          if (data && data.type === 'accountQueuedPosition') {
            status = { type: 'queued', position: data.position };
            if (
              this.state.appetizeStatus.type !== 'queued' ||
              !this.state.appetizeStatus.position
            ) {
              Analytics.getInstance().logEvent('QUEUED_FOR_PREVIEW', {
                queuePosition: status.position,
              });
              Analytics.getInstance().startTimer('previewQueue');
            }
          }
      }

      if (status) {
        this.setState({
          appetizeStatus: status,
        });
      }
    }
  };

  private handlePayerCodeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      payerCodeFormStatus: { type: 'open', value: e.target.value },
    });

  private handlePayerCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (this.props.viewer) {
      this.savePayerCode();
    }

    Analytics.getInstance().logEvent('ENTERED_APPETIZE_CODE', {}, 'previewQueue');
  };

  private savePayerCode = () => {
    const { payerCodeFormStatus } = this.state;

    if (payerCodeFormStatus.type !== 'open' || !payerCodeFormStatus.value) {
      return;
    }

    this.props.setMetadata({
      appetizeCode: payerCodeFormStatus.value,
    });

    this.setState({
      payerCodeFormStatus: { type: 'submitted' },
    });
  };

  private iframe = React.createRef<HTMLIFrameElement>();

  private endSession = () => {
    this.iframe.current?.contentWindow?.postMessage('endSession', '*');
  };

  render() {
    const { appetizeStatus, payerCodeFormStatus, viewer, appetizeURL } = this.state;
    const { width, isEmbedded } = this.props;

    return (
      <>
        <div
          className={css(isEmbedded ? styles.containerEmbedded : styles.container)}
          style={{ width: isEmbedded ? width : width - 10 }}
        >
          <iframe
            ref={this.iframe}
            key={appetizeURL}
            src={appetizeURL}
            className={css(styles.frame)}
          />
        </div>
        {appetizeStatus.type === 'queued' ? (
          <div className={css(styles.queueModal, styles.centered)}>
            <div className={css(styles.queueModalContent)}>
              {isEmbedded ? (
                <button
                  className={css(styles.dismissButton)}
                  onClick={() => {
                    this.setState({ appetizeStatus: { type: 'unknown' } });
                  }}
                >
                  X
                </button>
              ) : null}
              <h4>Device preview is at capacity</h4>
              <p>Queue position: {appetizeStatus.position ?? 1}</p>
              <h3>Don't want to wait?</h3>
              {!isEmbedded ? (
                <div>
                  <p>Use your own Appetize.io account</p>
                  <div className={css(styles.payerCodeForm)}>
                    {payerCodeFormStatus.type === 'open' ? (
                      <form onSubmit={this.handlePayerCodeSubmit}>
                        <input
                          type="text"
                          placeholder="Payer Code"
                          value={payerCodeFormStatus.value}
                          onChange={this.handlePayerCodeChange}
                          className={css(styles.payerCodeInput)}
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          className={css(styles.activateButton)}
                        >
                          Activate
                        </Button>
                      </form>
                    ) : payerCodeFormStatus.type === 'submitted' ? (
                      <p className={css(styles.payerCodeSubmitted)}>Payer code saved to profile!</p>
                    ) : viewer ? (
                      <ButtonLink
                        variant="primary"
                        href={`${getAppetizeConfig(this.props.sdkVersion).url}/payer-code`}
                        onClick={this.handlePayerCodeLink}
                        target="_blank"
                        className={css(styles.blockButton)}
                      >
                        Use Appetize.io
                      </ButtonLink>
                    ) : (
                      <ButtonLink
                        variant="primary"
                        href={getLoginHref()}
                        className={css(styles.blockButton)}
                      >
                        Log in to Expo
                      </ButtonLink>
                    )}
                  </div>
                  <p>or</p>
                </div>
              ) : null}

              <ButtonLink
                variant="primary"
                onClick={this.onClickRunOnPhone}
                className={css(styles.blockButton)}
              >
                Run it on your phone
              </ButtonLink>
            </div>
          </div>
        ) : null}
      </>
    );
  }
}

export default withThemeName(withAuth(AppetizeFrame));

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 1,
  },
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
  },
  container: {
    position: 'relative',
    height: 672,
    overflow: 'hidden',
    margin: 'auto',
    marginLeft: 10,
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
    width: 9999,
    height: 9999,
    border: 0,
    overflow: 'hidden',
  },
  queueModal: {
    color: 'white',
    backgroundColor: 'rgba(21, 23, 24, 0.8)',
    position: 'absolute',
    zIndex: 2,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 28,
  },
  queueModalContent: {
    textAlign: 'center',
  },
  blockButton: {
    display: 'block',
    flex: 1,
    cursor: 'pointer',
  },
  activateButton: {
    ':only-of-type': {
      marginLeft: 0,
      marginRight: 0,
      borderBottomLeftRadius: 0,
      borderTopLeftRadius: 0,
    },
  },
  payerCodeForm: {
    height: 50,
    display: 'flex',
    flexDirection: 'row',
  },
  payerCodeInput: {
    fontFamily: 'var(--font-monospace)',
    padding: 7,
    marginRight: -1,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    width: 133,
    border: `1px solid ${c('selected')}`,
    color: c('text'),
  },
  payerCodeSubmitted: {
    margin: '0 auto',
    padding: 14,
    textAlign: 'center',
    color: c('success'),
  },
  dismissButton: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: 400,
    right: 0,
    top: 0,
    zIndex: 2,
    height: 48,
    width: 48,
    padding: 16,
    border: 0,
    backgroundSize: 16,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundColor: 'transparent',
  },
});

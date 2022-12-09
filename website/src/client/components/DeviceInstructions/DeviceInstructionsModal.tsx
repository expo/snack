import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import constants from '../../configs/constants';
import ButtonLink from '../shared/ButtonLink';
import ModalDialog from '../shared/ModalDialog';
import SegmentedButton from '../shared/SegmentedButton';
import AccountTab from './AccountTab';
import QRCodeTab from './QRCodeTab';

export type EmbeddedConnectionMethod = 'device-id' | 'qr-code';
export type ConnectionMethod = 'account' | EmbeddedConnectionMethod;

type Props = {
  isEmbedded: boolean;
  experienceURL: string;
  method: ConnectionMethod;
  onChangeMethod: (method: ConnectionMethod) => void;
  onDismiss: () => void;
  setDeviceId: (deviceId: string) => void;
  deviceId: string | undefined;
  visible: boolean;
  large?: boolean;
};

export default class DeviceInstructionsModal extends React.Component<Props> {
  render() {
    const {
      large,
      visible,
      onDismiss,
      onChangeMethod,
      setDeviceId,
      deviceId,
      method,
      isEmbedded,
      experienceURL,
    } = this.props;

    const segments = [
      ...(!isEmbedded ? [{ id: 'account', text: 'Account' }] : []),
      { id: 'qr-code', text: 'QR Code' },
    ];

    // TODO: how do we handle people visiting from their mobile device?
    // used to show a button, maybe makes less sense now that we don't open the modal
    // automatically

    return (
      <ModalDialog
        className={css(large && styles.large)}
        autoSize={!large}
        visible={visible}
        title={large ? undefined : 'Run on your device'}
        onDismiss={onDismiss}>
        <div className={css(styles.container)}>
          <SegmentedButton
            selectedId={method}
            onSelect={(id: string) => onChangeMethod(id as ConnectionMethod)}
            segments={segments}
          />
          <div className={css(styles.wrapper)}>
            <div
              className={css(styles.pages)}
              style={{
                left: `${-segments.findIndex((s) => s.id === method) * 100}%`,
              }}>
              {segments.map(({ id }) => {
                let content;

                switch (id) {
                  case 'device-id':
                    content = (
                      <DeviceIDTab key={id} deviceId={deviceId} setDeviceId={setDeviceId} />
                    );
                    break;
                  case 'account':
                    content = <AccountTab key={id} />;
                    break;
                  case 'qr-code':
                    content = <QRCodeTab key={id} experienceURL={experienceURL} />;
                    break;
                }

                return (
                  <div
                    key={id}
                    className={css(styles.page)}
                    style={{ visibility: id === method ? 'visible' : 'hidden' }}>
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
          <div className={css(styles.downloadButtons)}>
            <ButtonLink
              target="_blank"
              href={constants.links.itunes}
              className={css(styles.button, styles.appstore)}>
              Get iOS App
            </ButtonLink>
            <ButtonLink
              target="_blank"
              href={constants.links.playstore}
              className={css(styles.button, styles.playstore)}>
              Get Android App
            </ButtonLink>
          </div>
        </div>
      </ModalDialog>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    maxWidth: 600,
  },
  title: {
    fontSize: '2em',
    fontWeight: 500,
  },
  button: {
    flex: 1,
    display: 'block',
    width: 208,
    margin: '.5em',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '.5em center',
    '-webkit-font-smoothing': 'initial',
  },
  appstore: {
    backgroundImage: `url(${require('../../assets/app-store-icon.png')})`,
    backgroundSize: '12px 23px',
  },
  playstore: {
    backgroundImage: `url(${require('../../assets/play-store-icon.png')})`,
    backgroundSize: '20px 23px',
  },
  whyNoQRCode: {
    opacity: 0.5,
    marginTop: '15px',
    marginBottom: '5px',
  },
  large: {
    minWidth: 0,
    minHeight: 0,
    maxWidth: 'calc(100% - 48px)',
    maxHeight: 'calc(100% - 48px)',
  },
  wrapper: {
    width: '100%',
    overflowX: 'hidden',
    marginTop: 16,
  },
  pages: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    width: '300%',
  },
  page: {
    width: 'calc(100% / 3)',
    display: 'block',
    textAlign: 'center',
  },
  downloadButtons: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginTop: 12,
  },
});

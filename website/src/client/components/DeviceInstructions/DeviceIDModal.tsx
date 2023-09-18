import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import DeviceIDTab from './DeviceIDTab';
import ModalDialog from '../shared/ModalDialog';

type Props = {
  onDismiss: () => void;
  setDeviceId: (deviceId: string) => void;
  deviceId: string | undefined;
  visible: boolean;
  large?: boolean;
};

export default class DeviceIDModal extends React.Component<Props> {
  render() {
    const { large, visible, onDismiss, setDeviceId, deviceId } = this.props;

    return (
      <ModalDialog
        className={css(large && styles.large)}
        autoSize={!large}
        visible={visible}
        title="Set Device ID"
        onDismiss={onDismiss}
      >
        <div className={css(styles.container)}>
          <div className={css(styles.wrapper)}>
            <DeviceIDTab deviceId={deviceId} setDeviceId={setDeviceId} />
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
});

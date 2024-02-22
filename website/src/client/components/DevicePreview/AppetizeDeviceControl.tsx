import { StyleSheet, css } from 'aphrodite';
import React, { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { useAppetizeDevices } from '../../utils/Appetize';
import { c } from '../ThemeProvider';

export function AppetizeDeviceControl({ children }: PropsWithChildren<object>) {
  return <div className={css(styles.container)}>{children}</div>;
}

type AppetizeActionProps = Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>;

AppetizeDeviceControl.ReloadSnack = function AppetizeReloadSnack(props: AppetizeActionProps) {
  return (
    <button type="button" className={css(styles.button)} title="Reload Snack" {...props}>
      Reload
    </button>
  );
};
AppetizeDeviceControl.ShakeDevice = function AppetizeShakeDevice(props: AppetizeActionProps) {
  return (
    <button type="button" className={css(styles.button)} title="Shake device (iOS only)" {...props}>
      Shake
    </button>
  );
};

AppetizeDeviceControl.RotateDevice = function AppetizeRotateDevice(props: AppetizeActionProps) {
  return (
    <button type="button" className={css(styles.button)} title="Rotate device clockwise" {...props}>
      Rotate
    </button>
  );
};

type AppetizeSelectDeviceProps = {
  platform: 'android' | 'ios';
  selectedDevice?: string;
  onSelectDevice?: (device: string) => void;
};

AppetizeDeviceControl.SelectDevice = function AppetizeSelectDevice({
  platform,
  onSelectDevice,
  selectedDevice,
}: AppetizeSelectDeviceProps) {
  const devices = useAppetizeDevices(platform);

  if (!selectedDevice) {
    return null;
  }

  return (
    <select
      className={css(styles.button)}
      value={selectedDevice}
      onChange={(event) => event.target.value && onSelectDevice?.(event.target.value)}
      disabled={!onSelectDevice}
    >
      {!devices.length ? (
        <option key={selectedDevice} value={selectedDevice}>
          {selectedDevice}
        </option>
      ) : (
        devices.map(({ deviceName, deviceId }) => (
          <option key={deviceId} value={deviceId}>
            {deviceName}
          </option>
        ))
      )}
    </select>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    appearance: 'none',
    outline: 0,
    border: `1px solid ${c('border')}`,
    borderLeftWidth: 0,
    backgroundColor: c('content'),
    color: c('text'),
    padding: 8,
    margin: '16px 0',
    textAlign: 'center',
    width: 112,

    ':first-child': {
      borderLeftWidth: 1,
      borderRadius: '3px 0 0 3px',
      padding: '6px 12px',
    },

    ':last-child': {
      borderRadius: '0 3px 3px 0',
      padding: '6px 12px',
    },

    ':only-child': {
      borderLeftWidth: 1,
      borderRadius: '3px',
      padding: '6px 12px',
    },

    ':hover': {
      backgroundColor: c('hover'),
    },

    ':disabled': {
      opacity: 0.5,
      backgroundColor: c('content'),
    },
  },
});

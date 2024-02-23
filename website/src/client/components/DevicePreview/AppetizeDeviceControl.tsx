import { StyleSheet, css } from 'aphrodite';
import React, { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { useAppetizeDevices } from '../../utils/Appetize';
import { c } from '../ThemeProvider';

export function AppetizeDeviceControl({ children }: PropsWithChildren<object>) {
  return <div className={css(styles.container)}>{children}</div>;
}

type AppetizeActionProps = Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>;

AppetizeDeviceControl.RestartSnack = function AppetizeRestartSnack(props: AppetizeActionProps) {
  return (
    <button
      type="button"
      className={css(styles.button)}
      title="Restart Snack"
      aria-label="Restart Snack"
      {...props}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 10C2 10 4.00498 7.26822 5.63384 5.63824C7.26269 4.00827 9.5136 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.89691 21 4.43511 18.2543 3.35177 14.5M2 10V4M2 10H8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
AppetizeDeviceControl.OpenDevMenu = function AppetizeOpenDevMenu(props: AppetizeActionProps) {
  return (
    <button
      type="button"
      className={css(styles.button)}
      title="Open Expo dev menu"
      aria-label="Open Expo dev menu"
      {...props}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M3 8L15 8M15 8C15 9.65686 16.3431 11 18 11C19.6569 11 21 9.65685 21 8C21 6.34315 19.6569 5 18 5C16.3431 5 15 6.34315 15 8ZM9 16L21 16M9 16C9 17.6569 7.65685 19 6 19C4.34315 19 3 17.6569 3 16C3 14.3431 4.34315 13 6 13C7.65685 13 9 14.3431 9 16Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

AppetizeDeviceControl.RotateDevice = function AppetizeRotateDevice(props: AppetizeActionProps) {
  return (
    <button
      type="button"
      className={css(styles.button)}
      title="Rotate device clockwise"
      aria-label="Rotate device clockwise"
      {...props}
    >
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 20V18.6C4 15.2397 4 13.5595 4.65396 12.2761C5.2292 11.1471 6.14708 10.2292 7.27606 9.65396C8.55953 9 10.2397 9 13.6 9H20M20 9L15 14M20 9L15 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
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

  return (
    <select
      className={css(styles.button)}
      value={selectedDevice}
      onChange={(event) => event.target.value && onSelectDevice?.(event.target.value)}
      disabled={!onSelectDevice}
      title="Select device"
      aria-label="Select device"
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
    margin: '0 16px',
  },
  button: {
    appearance: 'none',
    outline: 0,
    border: `1px solid ${c('border')}`,
    borderLeftWidth: 0,
    backgroundColor: c('content'),
    color: c('text'),
    padding: '8px 12px',
    margin: '16px 0',
    textAlign: 'center',
    height: 34,

    ':first-child': {
      borderLeftWidth: 1,
      borderRadius: '3px 0 0 3px',
    },

    ':last-child': {
      borderRadius: '0 3px 3px 0',
      padding: '6px 12px',
    },

    ':only-child': {
      borderLeftWidth: 1,
      borderRadius: '3px',
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

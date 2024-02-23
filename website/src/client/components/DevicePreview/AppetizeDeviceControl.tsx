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
AppetizeDeviceControl.ShakeDevice = function AppetizeShakeDevice(props: AppetizeActionProps) {
  return (
    <button
      type="button"
      className={css(styles.button)}
      title="Shake device (iOS only)"
      aria-label="Shake device (iOS only)"
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
          d="M16.7243 19.5043L11.4274 20.9086C10.6467 21.1156 10.2564 21.2191 9.9098 21.1192C9.60492 21.0315 9.32367 20.8369 9.10642 20.5635C8.85942 20.2527 8.73495 19.7931 8.48603 18.8739L5.4637 7.713C5.21478 6.79379 5.09032 6.33417 5.14717 5.9428C5.19717 5.59853 5.34242 5.29091 5.56209 5.06402C5.81182 4.80607 6.20216 4.70258 6.98281 4.49561L12.2797 3.09125C13.0603 2.88427 13.4507 2.78077 13.7973 2.88062C14.1021 2.96843 14.3834 3.16298 14.6006 3.43639C14.8477 3.7472 14.9721 4.2068 15.221 5.12602L18.2434 16.2869C18.4923 17.2061 18.6168 17.6657 18.5599 18.0571C18.5099 18.4013 18.3646 18.709 18.145 18.9358C17.8953 19.1938 17.5049 19.2973 16.7243 19.5043Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M2.42859 8.3175L5.8274 20.8686" stroke="currentColor" strokeLinecap="round" />
        <path d="M1 10.7657L3.35302 19.455" stroke="currentColor" strokeLinecap="round" />
        <path d="M18.1726 3.31982L21.5714 15.871" stroke="currentColor" strokeLinecap="round" />
        <path d="M20.647 4.73328L23 13.4225" stroke="currentColor" strokeLinecap="round" />
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

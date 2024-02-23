import { StyleSheet, css } from 'aphrodite';
import React, { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import type { AppetizeFontScale } from './AppetizeFrame';
import { useAppetizeDevices } from '../../utils/Appetize';
import { c } from '../ThemeProvider';

export function AppetizeDeviceControl({ children }: PropsWithChildren<object>) {
  return <div className={css(styles.container)}>{children}</div>;
}

AppetizeDeviceControl.Group = function AppetizeDeviceControlGroup({ children }: PropsWithChildren<object>) {
  return <div className={css(styles.group)}>{children}</div>;
};

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

type AppetizeDeviceAppearanceProps = AppetizeActionProps & {
  appearance?: 'light' | 'dark';
};

AppetizeDeviceControl.DeviceAppearance = function AppetizeDeviceAppearance(
  props: AppetizeDeviceAppearanceProps
) {
  const title =
    props.appearance === 'light' ? 'Switch device to dark mode' : 'Switch to device light mode';

  return (
    <button
      type="button"
      className={css(styles.button)}
      title={title}
      aria-label={title}
      {...props}
    >
      {props.appearance === 'light' && (
        // Render the dark mode icon (switching to dark)
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.5395 2.91375C11.9489 2.68037 12.1398 2.19279 11.9977 1.74343C11.8556 1.29408 11.4191 1.00494 10.9499 1.04942C5.36684 1.57878 1 6.27878 1 11.9999C1 18.075 5.92487 22.9999 12 22.9999C17.7208 22.9999 22.4206 18.6335 22.9504 13.0509C22.9949 12.5817 22.7058 12.1451 22.2564 12.003C21.8071 11.8608 21.3195 12.0517 21.0861 12.4612C19.8798 14.5771 17.6055 16.0001 15 16.0001C11.134 16.0001 8 12.8661 8 9.00012C8 6.39446 9.4232 4.11995 11.5395 2.91375Z"
            fill="currentColor"
          />
        </svg>
      )}

      {props.appearance === 'dark' && (
        // Render the light mode icon (switching to light)
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 2C13 1.44772 12.5523 1 12 1C11.4477 1 11 1.44772 11 2V4C11 4.55228 11.4477 5 12 5C12.5523 5 13 4.55228 13 4V2Z"
            fill="currentColor"
          />
          <path
            d="M13 20C13 19.4477 12.5523 19 12 19C11.4477 19 11 19.4477 11 20V22C11 22.5523 11.4477 23 12 23C12.5523 23 13 22.5523 13 22V20Z"
            fill="currentColor"
          />
          <path
            d="M1 12C1 11.4477 1.44772 11 2 11H4C4.55228 11 5 11.4477 5 12C5 12.5523 4.55228 13 4 13H2C1.44772 13 1 12.5523 1 12Z"
            fill="currentColor"
          />
          <path
            d="M5.60701 4.1928C5.21649 3.80227 4.58332 3.80227 4.1928 4.1928C3.80227 4.58332 3.80227 5.21649 4.1928 5.60701L5.60701 7.02122C5.99753 7.41175 6.6307 7.41175 7.02122 7.02122C7.41175 6.6307 7.41175 5.99753 7.02122 5.60701L5.60701 4.1928Z"
            fill="currentColor"
          />
          <path
            d="M19.8072 4.1928C20.1978 4.58332 20.1978 5.21649 19.8072 5.60701L18.393 7.02122C18.0025 7.41175 17.3693 7.41175 16.9788 7.02122C16.5883 6.6307 16.5883 5.99753 16.9788 5.60701L18.393 4.1928C18.7835 3.80227 19.4167 3.80227 19.8072 4.1928Z"
            fill="currentColor"
          />
          <path
            d="M7.02122 18.397C7.41175 18.0065 7.41175 17.3734 7.02122 16.9828C6.6307 16.5923 5.99753 16.5923 5.60701 16.9828L4.1928 18.397C3.80227 18.7876 3.80227 19.4207 4.1928 19.8113C4.58332 20.2018 5.21649 20.2018 5.60701 19.8113L7.02122 18.397Z"
            fill="currentColor"
          />
          <path
            d="M16.9788 16.9828C17.3693 16.5923 18.0025 16.5923 18.393 16.9828L19.8072 18.397C20.1978 18.7876 20.1978 19.4207 19.8072 19.8113C19.4167 20.2018 18.7835 20.2018 18.393 19.8113L16.9788 18.397C16.5883 18.0065 16.5883 17.3734 16.9788 16.9828Z"
            fill="currentColor"
          />
          <path
            d="M20 11C19.4477 11 19 11.4477 19 12C19 12.5523 19.4477 13 20 13H22C22.5523 13 23 12.5523 23 12C23 11.4477 22.5523 11 22 11H20Z"
            fill="currentColor"
          />
          <path
            d="M12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6Z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
};

type AppetizeSelectFontScaleProps = {
  disabled?: boolean;
  selectedFontScale?: AppetizeFontScale;
  onSelectFontScale?: (fontScale?: AppetizeFontScale) => void;
};

AppetizeDeviceControl.SelectFontScale = function AppetizeSelectFontScale({
  disabled,
  onSelectFontScale,
  selectedFontScale,
}: AppetizeSelectFontScaleProps) {
  function onSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    if (event.target.value) {
      onSelectFontScale?.(event.target.value as AppetizeFontScale);
    } else {
      onSelectFontScale?.(undefined);
    }
  }

  return (
    <select
      className={css(styles.button)}
      value={selectedFontScale}
      onChange={onSelectChange}
      disabled={disabled}
      title="Change font scaling"
      aria-label="Change font scaling"
    >
      <option value="">no scaling</option>
      <option value="xs">xs - extra small</option>
      <option value="s">s - small</option>
      <option value="m">m - medium</option>
      <option value="l">l - large</option>
      <option value="xl">xl - extra large</option>
      <option value="xxl">xxl - double extra large</option>
      <option value="xxxl">xxxl - triple extra large</option>
    </select>
  );
};

type AppetizeSelectDeviceProps = {
  platform: 'android' | 'ios';
  disabled?: boolean;
  selectedDevice?: string;
  onSelectDevice?: (device: string) => void;
};

AppetizeDeviceControl.SelectDevice = function AppetizeSelectDevice({
  platform,
  disabled,
  onSelectDevice,
  selectedDevice,
}: AppetizeSelectDeviceProps) {
  const devices = useAppetizeDevices(platform);

  return (
    <select
      className={css(styles.button)}
      value={selectedDevice}
      onChange={(event) => event.target.value && onSelectDevice?.(event.target.value)}
      disabled={disabled}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 8px',
  },
  group: {
    display: 'flex',
    flex: 0,
    flexDirection: 'row',
    margin: '0 8px',
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

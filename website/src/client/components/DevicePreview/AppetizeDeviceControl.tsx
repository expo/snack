import { StyleSheet, css } from 'aphrodite';
import React, { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import type { AppetizeFontScale } from './AppetizeFrame';
import {
  DarkModeIcon,
  DevMenuIcon,
  LightModeIcon,
  ReloadIcon,
  RotateDeviceRightIcon,
} from './DeviceControlIcons';
import { useAppetizeDevices } from '../../utils/Appetize';
import { c } from '../ThemeProvider';

export function AppetizeDeviceControl({ children }: PropsWithChildren<object>) {
  return <div className={css(styles.container)}>{children}</div>;
}

AppetizeDeviceControl.Group = function AppetizeDeviceControlGroup({
  children,
}: PropsWithChildren<object>) {
  return <div className={css(styles.group)}>{children}</div>;
};

type AppetizeActionProps = Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'disabled'>;

AppetizeDeviceControl.RestartSnack = function AppetizeRestartSnack(props: AppetizeActionProps) {
  const title = 'Restart Snack';

  return (
    <button
      type="button"
      className={css(styles.button)}
      title={title}
      aria-label={title}
      {...props}
    >
      <ReloadIcon />
    </button>
  );
};
AppetizeDeviceControl.OpenDevMenu = function AppetizeOpenDevMenu(props: AppetizeActionProps) {
  const title = 'Open Expo dev menu';

  return (
    <button
      type="button"
      className={css(styles.button)}
      title={title}
      aria-label={title}
      {...props}
    >
      <DevMenuIcon />
    </button>
  );
};

AppetizeDeviceControl.RotateDevice = function AppetizeRotateDevice(props: AppetizeActionProps) {
  const title = 'Rotate device clockwise';

  return (
    <button
      type="button"
      className={css(styles.button)}
      title={title}
      aria-label={title}
      {...props}
    >
      <RotateDeviceRightIcon />
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
      {props.appearance === 'light' && <DarkModeIcon />}
      {props.appearance === 'dark' && <LightModeIcon />}
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

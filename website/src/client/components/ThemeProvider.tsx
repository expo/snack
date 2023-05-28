import { palette, lightTheme, darkTheme } from '@expo/styleguide-base';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import hsl from 'hsl-to-hex';
import mapKeys from 'lodash/mapKeys';
import * as React from 'react';

import usePreferences from './Preferences/usePreferences';
import { ThemeName } from './Preferences/withThemeName';

type Colors = typeof lightColorsDef;
type ColorName = keyof typeof lightColorsDef;
type Shadows = typeof lightShadows;
type ShadowName = keyof typeof lightShadows;

const lightColorsDef = {
  primary: lightTheme.button.primary.background,
  secondary: lightTheme.text.secondary,
  error: lightTheme.text.danger,
  warning: lightTheme.text.warning,
  success: lightTheme.text.success,
  'primary-text': palette.white,
  'secondary-text': palette.white,
  'error-text': palette.white,
  'warning-text': palette.white,
  'success-text': palette.white,

  text: lightTheme.text.default,
  soft: lightTheme.text.secondary,
  'soft-text': palette.white,

  background: lightTheme.background.screen,
  content: lightTheme.background.default,
  hover: lightTheme.background.subtle,
  disabled: lightTheme.background.screen,
  selected: lightTheme.background.selected,
  'selected-text': palette.white,
  border: lightTheme.border.default,
  'border-editor': lightTheme.border.secondary,
};

const lightColors = Object.keys(lightColorsDef).reduce((acc, key) => {
  return { ...acc, [key]: convertToHex(lightColorsDef[key as ColorName]) };
}, {});

const lightShadows = {
  popover: '0 15px 25px rgba(0, 0, 0, 0.12), 0 5px 10px rgba(0, 0, 0, 0.05)',
  small: '0 3px 6px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.07)',
};

const darkColorsDef: Colors = {
  primary: darkTheme.button.primary.background,
  secondary: darkTheme.text.default,
  error: darkTheme.text.danger,
  warning: darkTheme.text.warning,
  success: darkTheme.text.success,
  'primary-text': palette.white,
  'secondary-text': palette.white,
  'error-text': palette.white,
  'warning-text': palette.white,
  'success-text': palette.white,

  text: darkTheme.text.default,
  soft: darkTheme.text.secondary,
  'soft-text': palette.white,

  background: darkTheme.background.screen,
  content: darkTheme.background.default,
  hover: darkTheme.background.subtle,
  disabled: darkTheme.background.screen,
  selected: darkTheme.background.selected,
  'selected-text': palette.white,
  border: darkTheme.border.default,
  'border-editor': palette.dark.gray4,
};

const darkColors = Object.keys(darkColorsDef).reduce((acc, key) => {
  return { ...acc, [key]: convertToHex(darkColorsDef[key as ColorName]) };
}, {});

const darkShadows: Shadows = {
  popover: '0 15px 25px rgba(0, 0, 0, 0.5), 0 5px 10px rgba(0, 0, 0, 0.25)',
  small: '0 3px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.25)',
};

export function c(color: ColorName, theme?: ThemeName) {
  if (theme) {
    const colors = (theme === 'dark' ? darkColors : lightColors) as Colors;
    return colors[color];
  } else {
    return `var(--color-${color})`;
  }
}

export function s(shadow: ShadowName, theme?: ThemeName) {
  if (theme) {
    const shadows = theme === 'dark' ? darkShadows : lightShadows;
    return shadows[shadow];
  } else {
    return `var(--shadow-${shadow})`;
  }
}

type Props = {
  style?: any;
  className?: string;
  children: React.ReactNode;
  theme?: ThemeName;
};

export default function ThemeProvider({ children, style, className, theme }: Props) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [prefs] = theme ? [{ theme }] : usePreferences();

  return (
    <div
      className={classnames(
        css(style || styles.container, prefs.theme === 'dark' ? styles.dark : styles.light),
        className
      )}>
      {children}
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
  },
  light: {
    ...mapKeys(lightColors, (_, key) => `--color-${key}`),
    ...mapKeys(lightShadows, (_, key) => `--shadow-${key}`),
  },
  dark: {
    ...mapKeys(darkColors, (_, key) => `--color-${key}`),
    ...mapKeys(darkShadows, (_, key) => `--shadow-${key}`),
  },
});

function convertToHex(color: string) {
  if (color.startsWith('hsl')) {
    const hslChunks =
      /hsl\(\s*(\d+)\s*,\s*(\d*(?:\.\d+)?%)\s*,\s*(\d*(?:\.\d+)?%)\)/.exec(color) ?? [];
    return hsl(parseInt(hslChunks[1], 10), parseFloat(hslChunks[2]), parseFloat(hslChunks[3]));
  }
  return color;
}

import { colors, shadows } from '@expo/styleguide';
import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import mapKeys from 'lodash/mapKeys';
import * as React from 'react';

import usePreferences from './Preferences/usePreferences';
import { ThemeName } from './Preferences/withThemeName';

type Colors = typeof lightColors;
type ColorName = keyof typeof lightColors;
type Shadows = typeof lightShadows;
type ShadowName = keyof typeof lightShadows;

const lightColors = {
  primary: colors.primary[500],
  secondary: colors.black,
  error: colors.semantic.error,
  warning: colors.semantic.warning,
  success: colors.semantic.success,
  'primary-text': colors.white,
  'secondary-text': colors.white,
  'error-text': colors.white,
  'warning-text': colors.white,
  'success-text': colors.white,

  text: colors.gray[900],
  soft: colors.gray[500],
  'soft-text': colors.white,
  // semantic.background offered too little contrast with content
  // background: colors.semantic.background,
  background: '#F9F9F9',
  content: colors.white,
  hover: colors.gray[100],
  disabled: colors.gray[300],
  selected: colors.primary[500],
  'selected-text': colors.white,
  border: colors.semantic.border,
};

const lightShadows = {
  popover: shadows.popover,
  small: shadows.small,
};

// Use custom colors for dark theme which are not
// so saturated and blue-ish
// const darkGray = colors.gray;
const darkGray = {
  100: '#F5F5F5',
  200: '#EBEBEB',
  250: '#DDDDDD',
  300: '#CFCFCF',
  400: '#B0B0B0',
  500: '#8F8F8F',
  600: '#5C5C5C',
  700: '#3B3B3B',
  800: '#2F2F2F',
  900: '#212121',
};

const darkColors: Colors = {
  primary: colors.primary[400],
  secondary: colors.white,
  error: colors.red[500],
  warning: colors.yellow[500],
  success: colors.green[600],
  'primary-text': colors.white,
  'secondary-text': colors.black,
  'error-text': colors.white,
  'warning-text': colors.white,
  'success-text': colors.white,

  text: darkGray[200],
  soft: darkGray[500],
  'soft-text': colors.black,
  background: darkGray[900],
  content: darkGray[800],
  hover: darkGray[700],
  disabled: darkGray[600],
  selected: colors.white,
  'selected-text': darkGray[800],
  border: darkGray[700],
};

const darkShadows: Shadows = {
  popover: shadows.popover,
  small: 'none',
};

export function c(color: ColorName, theme?: ThemeName) {
  if (theme) {
    const colors = theme === 'dark' ? darkColors : lightColors;
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

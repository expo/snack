import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import * as React from 'react';

import { c, s } from '../ThemeProvider';

export type ButtonCommonProps = {
  variant?: 'primary' | 'secondary';
  large?: boolean;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
};

type Props = ButtonCommonProps & {
  type?: 'submit' | 'button';
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
};

const rotate = {
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
};

export const getClassNames = ({ variant, icon, large, disabled, loading }: ButtonCommonProps) => {
  return css(
    styles.button,
    styles[variant ?? 'normal'],
    icon ? styles.iconButton : large ? styles.largeButton : styles.normalButton,
    loading && styles.loading,
    disabled && styles.disabled
  );
};

export default function Button({
  variant,
  icon,
  large,
  disabled,
  loading,
  className,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      className={classnames(getClassNames({ variant, icon, large, disabled, loading }), className)}
      disabled={disabled}
      style={icon ? { backgroundImage: `url(${icon})` } : {}}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    appearance: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    outline: 0,
    borderRadius: 3,
    whiteSpace: 'nowrap',
    textAlign: 'center',
    textDecoration: 'none',
    transitionDuration: '170ms',
    transitionProperty: 'box-shadow',
    transitionTimingFunction: 'linear',

    ':hover': {
      boxShadow: s('small'),
    },
  },

  primary: {
    color: c('primary-text'),
    backgroundColor: c('primary'),
    border: `1px solid transparent`,
  },

  secondary: {
    color: c('secondary-text'),
    backgroundColor: c('secondary'),
    border: `1px solid transparent`,
  },

  normal: {
    color: c('text'),
    border: `1px solid ${c('border')}`,
  },

  disabled: {
    cursor: 'not-allowed',
    pointerEvents: 'none',
    opacity: 0.3,
  },

  iconButton: {
    padding: '.5em 1em .5em 36px',
    margin: '.5em',
    backgroundSize: 16,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '12px center',
  },

  normalButton: {
    padding: '.5em 1em',
    margin: '.5em',
  },

  largeButton: {
    fontSize: 16,
    padding: '1em 1.5em',
    margin: '.5em 0',
    width: '100%',
  },

  loading: {
    ':before': {
      display: 'inline-block',
      content: '""',
      borderWidth: 2,
      borderStyle: 'solid',
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
      borderRightColor: 'rgba(255, 255, 255, 0.2)',
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
      borderLeftColor: c('primary-text'),
      height: 16,
      width: 16,
      borderRadius: '50%',
      marginRight: '.75em',
      verticalAlign: -3,
      animationName: [rotate],
      animationDuration: '1s',
      animationIterationCount: 'infinite',
      animationTimingFunction: 'linear',
    },
  },
});

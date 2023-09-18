import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c, s } from '../ThemeProvider';

type Props = {
  type?: 'submit' | 'button';
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  label?: string;
  responsive?: boolean;
  children?: React.ReactNode;
  small?: boolean;
};

function IconButton({ title, label, responsive, children, small, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={css(styles.button, small && styles.small, rest.disabled && styles.disabled)}>
      {children}
      {label ? (
        <span
          className={css(
            styles.label,
            !children && styles.labelNoIcon,
            responsive && styles.responsive,
          )}>
          {label}
        </span>
      ) : null}
      <span className={css(styles.phantom)}>
        <span className={css(styles.tooltip)}>{title}</span>
      </span>
    </button>
  );
}

export default IconButton;

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    height: 40,
    minWidth: 40,
    margin: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    color: 'inherit',
    padding: 0,
    outline: 0,
    border: 0,
    borderRadius: 2,
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    fill: c('text'),
    stroke: c('text'),

    ':active': {
      opacity: 0.8,
    },

    ':hover': {
      cursor: 'pointer',
      backgroundColor: c('hover'),
    },
  },

  small: {
    height: 32,
    minWidth: 32,
    margin: 0,
    padding: '0 8px 0 0',

    ':hover': {
      backgroundColor: 'transparent',
    },
  },

  disabled: {
    cursor: 'not-allowed',
    pointerEvents: 'none',
    opacity: 0.3,
  },

  phantom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    zIndex: 1,

    ':hover': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  },

  tooltip: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: '50%',
    transform: 'translateX(-50%)',
    marginLeft: -2.5,
    borderRadius: 2,
    fontSize: 12,
    padding: '4px 8px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    boxShadow: s('popover'),
    backgroundColor: c('content', 'dark'),
    color: c('text', 'dark'),
  },

  label: {
    margin: '0 12px',
    color: c('text'),
  },

  labelNoIcon: {
    margin: '0 12px 0 0',
  },

  responsive: {
    '@media (max-width: 960px)': {
      display: 'none',
    },
  },
});

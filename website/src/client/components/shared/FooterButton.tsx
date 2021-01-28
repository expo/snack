import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  active?: boolean;
  icon?: string;
  children?: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export default function FooterButton({ active, icon, children, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={icon ? { backgroundImage: `url(${icon})` } : undefined}
      className={css(
        styles.button,
        children ? styles.buttonLabel : undefined,
        active && styles.active
      )}>
      {children}
    </button>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    border: 0,
    outline: 0,
    margin: 0,
    height: 30,
    padding: '0 16px',
    appearance: 'none',
    backgroundColor: 'transparent',
    backgroundSize: 16,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center right 8px',
    ':active': {
      backgroundColor: c('hover'),
    },
    ':hover': {
      backgroundColor: c('hover'),
    },
  },

  buttonLabel: {
    '@media (min-width: 720px)': {
      padding: '5px 32px 5px 8px',
    },
  },

  active: {
    backgroundColor: c('hover'),
  },
});

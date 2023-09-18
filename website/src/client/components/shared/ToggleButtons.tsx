import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props<T extends string> = {
  options: {
    label: string;
    value: T;
  }[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
};

export default function ToggleButtons<T extends string>(props: Props<T>) {
  return (
    <span
      className={classnames(
        css(styles.buttons, props.disabled && styles.disabled),
        props.className
      )}
    >
      {props.options.map((o) => (
        <button
          key={o.value}
          className={css(
            styles.button,
            o.value === props.value
              ? props.disabled
                ? styles.activeDisabled
                : styles.active
              : undefined
          )}
          onClick={() => props.onValueChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none',
    cursor: 'not-allowed',
  },

  buttons: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },

  button: {
    appearance: 'none',
    outline: 0,
    margin: 0,
    border: `1px solid ${c('border')}`,
    borderLeftWidth: 0,
    backgroundColor: c('content'),
    color: c('text'),
    lineHeight: 1,
    padding: 6,

    ':first-of-type': {
      borderLeftWidth: 1,
      borderRadius: '3px 0 0 3px',
      padding: '6px 12px',
    },

    ':last-of-type': {
      borderRadius: '0 3px 3px 0',
      padding: '6px 12px',
    },

    ':only-of-type': {
      borderLeftWidth: 1,
      borderRadius: '3px',
      padding: '6px 12px',
    },

    ':hover': {
      backgroundColor: c('hover'),
    },
  },

  active: {
    backgroundColor: c('primary'),
    borderColor: c('primary'),
    color: c('primary-text'),
    ':hover': {
      backgroundColor: c('primary'),
    },
  },

  activeDisabled: {
    backgroundColor: c('disabled'),
    color: c('text'),
    ':hover': {
      backgroundColor: c('disabled'),
    },
  },
});

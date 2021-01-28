import { StyleSheet, css } from 'aphrodite';
import classnames from 'classnames';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  checked: boolean;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
};

export default function ToggleSwitch(props: Props) {
  return (
    <label className={classnames(css(styles.container), props.className)}>
      <span className={css(styles.label)}>{props.label}</span>
      <span className={css(styles.switch, props.checked ? styles.active : styles.inactive)} />
      <input
        type="checkbox"
        checked={props.checked}
        onChange={props.onChange}
        className={css(styles.check)}
      />
    </label>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  switch: {
    display: 'inline-block',
    verticalAlign: -4,
    width: 36,
    height: 20,
    borderRadius: 12,
    border: `1px solid ${c('border')}`,

    ':before': {
      content: '""',
      display: 'inline-block',
      height: 14,
      width: 14,
      borderRadius: 7,
      margin: 2,
      transition: '.2s',
      transform: 'translateX(0)',
    },
  },
  inactive: {
    ':before': {
      transform: 'translateX(0)',
      backgroundColor: c('soft'),
    },
  },
  active: {
    backgroundColor: c('content'),
    ':before': {
      transform: 'translateX(16px)',
      backgroundColor: c('selected'),
    },
  },
  check: {
    display: 'none',
  },
  label: {
    flex: 1,
    padding: '0 .5em',
    fontWeight: 'normal',
  },
});

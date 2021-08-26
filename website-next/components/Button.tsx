import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

export const Button = (props) => {
  const { label, loading, style, ...rest } = props;
  return (
    <a className={css(styles.button, style)} href="#" {...rest} disabled={loading}>
      {label}
    </a>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 4,
    border: 'none',
    outline: 'none',
    backgroundColor: '#4630EB',
    color: 'white',
    pointer: 'cursor',
    height: 40,
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 12px',
    fontWeight: 'bold',
    margin: 0,
  },
});

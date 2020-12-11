import * as React from 'react';

export const Button = (props) => {
  const { label, loading, style = {}, ...rest } = props;
  return (
    <a style={{ ...styles.button, ...style }} href="#" {...rest} disabled={loading}>
      {label}
    </a>
  );
};

export const Toolbar = (props) => {
  const { title, children } = props;
  return (
    <div style={styles.toolbar}>
      <div style={styles.toolbarTitle}>{title}</div>
      {children}
    </div>
  );
};

const styles = {
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
    margin: '0',
  },
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    marginBottom: 8,
  },
  toolbarTitle: {
    display: 'flex',
    flex: 1,
    fontWeight: 'bold',
    opacity: 0.7,
  },
};

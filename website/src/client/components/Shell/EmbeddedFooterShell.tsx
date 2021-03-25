import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  type?: 'loading' | 'error' | null;
  children?: React.ReactNode;
};

export default function EmbeddedFooterShell({ type, children }: Props) {
  return (
    <div className={css(styles.footer, type === 'loading' ? styles.footerLoading : null)}>
      {children}
    </div>
  );
}

const styles = StyleSheet.create({
  footer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    color: c('disabled'),
    transition: 'background .2s',
    padding: '0 4px',
    fontSize: 12,
  },

  footerLoading: {
    backgroundColor: c('primary'),
    color: c('primary-text'),
  },
});

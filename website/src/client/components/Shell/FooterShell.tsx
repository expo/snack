import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  type?: 'loading' | 'error' | null;
  children?: React.ReactNode;
};

export default function FooterShell({ type, children }: Props) {
  return (
    <div
      className={css(
        styles.footer,
        type === 'error'
          ? styles.footerErrorFatal
          : type === 'loading'
          ? styles.footerLoading
          : undefined
      )}>
      {children}
    </div>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 .25em',
    borderTop: `1px solid ${c('border-editor')}`,
    backgroundColor: c('content'),
    color: c('soft'),
    height: 30,
    zIndex: 10,
  },

  footerErrorFatal: {
    backgroundColor: c('error'),
    color: c('error-text'),
  },

  footerLoading: {
    backgroundColor: c('primary'),
    color: c('primary-text'),
  },
});

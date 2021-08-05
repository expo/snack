import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  children?: React.ReactNode;
};

export default function EmbeddedToolbarShell({ children }: Props) {
  return <div className={css(styles.toolbar)}>{children}</div>;
}

const styles = StyleSheet.create({
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    height: 48,
    backgroundColor: c('content'),
    borderBottom: `1px solid ${c('border')}`,
    color: c('text'),
  },
});

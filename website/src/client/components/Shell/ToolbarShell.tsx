import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  children: React.ReactNode;
};

export default function ToolbarShell({ children }: Props) {
  return <div className={css(styles.toolbar)}>{children}</div>;
}

const styles = StyleSheet.create({
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${c('border-editor')}`,
    height: 60,
    backgroundColor: c('content'),
  },
});

import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  children?: React.ReactNode;
};

export default function SidebarShell({ children }: Props) {
  return <div className={css(styles.sidebar)}>{children}</div>;
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minWidth: 240,
    borderRight: `1px solid ${c('border')}`,
    backgroundColor: c('content'),
  },
});

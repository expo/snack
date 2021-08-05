import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  children: React.ReactNode;
};

export default function ContentShell({ children }: Props) {
  return <div className={css(styles.container)}>{children}</div>;
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: c('background'),
    color: c('text'),
  },
});

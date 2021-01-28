import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import constants from '../../configs/constants';
import { c } from '../ThemeProvider';

type Props = {
  children?: React.ReactNode;
};

export default function PreviewShell({ children }: Props) {
  return <div className={css(styles.sidebar)}>{children}</div>;
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    display: 'none',
    minWidth: 334,
    [`@media (min-width: ${constants.preview.minWidth}px)`]: {
      display: 'flex',
    },
    backgroundColor: c('content'),
    borderLeft: `1px solid ${c('border')}`,
  },
});

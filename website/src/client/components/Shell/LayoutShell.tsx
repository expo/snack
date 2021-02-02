import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

type Props = {
  children: React.ReactNode;
};

export default function LayoutShell({ children }: Props) {
  return <div className={css(styles.layout)}>{children}</div>;
}

const styles = StyleSheet.create({
  layout: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
    height: '100%',
    // Without this firefox doesn't shrink content
    minHeight: 0,
    minWidth: 0,
  },
});

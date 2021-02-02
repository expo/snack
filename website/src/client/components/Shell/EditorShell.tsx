import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import AnimatedLogo from '../shared/AnimatedLogo';

export default function EditorShell() {
  return (
    <div className={css(styles.container)}>
      <div className={css(styles.logo)}>
        <AnimatedLogo />
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    transform: 'scale(0.4)',
    opacity: 0.2,
  },
});

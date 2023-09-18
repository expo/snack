import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import Modal from './Modal';
import ThemeProvider, { c, s } from '../ThemeProvider';

export type ModalSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  className?: string;
};

export default function ModalSheet(props: ModalSheetProps) {
  return (
    <Modal visible={props.visible} onDismiss={props.onDismiss}>
      <ThemeProvider style={styles.modal} className={props.className}>
        {props.onDismiss ? (
          <button
            className={css(styles.close)}
            onClick={props.onDismiss}
            data-test-id="modal-close">
            ✕
          </button>
        ) : null}
        {props.children}
      </ThemeProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    textAlign: 'center',
    borderRadius: 4,
    boxShadow: s('popover'),
    backgroundColor: c('content'),
    color: c('text'),
  },
  close: {
    appearance: 'none',
    borderRadius: '1em',
    outline: 0,
    padding: 0,
    position: 'absolute',
    right: '-1em',
    top: '-1em',
    width: '2em',
    height: '2em',
    background: c('text'),
    border: `2px solid ${c('content')}`,
    boxShadow: '0 1.5px 3px rgba(0, 0, 0, .16)',
    color: c('content'),
    fontSize: '1em',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import ModalDialog from '../shared/ModalDialog';
import Spinner from '../shared/Spinner';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export default function ModalPublishing(props: Props) {
  return (
    <ModalDialog visible={props.visible} onDismiss={props.onDismiss} title="Saving Snack…">
      <div className={css(styles.content)}>
        <Spinner />
      </div>
    </ModalDialog>
  );
}

const styles = StyleSheet.create({
  content: {
    margin: '16px 8px 12px',
  },
});

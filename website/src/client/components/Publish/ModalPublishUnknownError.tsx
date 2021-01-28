import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import ModalDialog from '../shared/ModalDialog';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export default class ModalPublishUnknownError extends React.PureComponent<Props> {
  render() {
    return (
      <ModalDialog
        visible={this.props.visible}
        onDismiss={this.props.onDismiss}
        title="Couldn't save the Snack!">
        <p className={css(styles.text)}>
          An unknown error occurred when saving your Snack. Please try again later.
        </p>
      </ModalDialog>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});

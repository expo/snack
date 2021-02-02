import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { Viewer } from '../../types';
import Analytics from '../../utils/Analytics';
import Avatar from '../shared/Avatar';
import ModalDialog from '../shared/ModalDialog';

type Props = {
  visible: boolean;
  viewer: Viewer | undefined;
  onDismiss: () => void;
};

class ModalSuccessfulPublish extends React.PureComponent<Props> {
  componentDidUpdate(prevProps: Props) {
    if (!prevProps.visible && this.props.visible) {
      Analytics.getInstance().logEvent('CREATED_USER_SNACK');
    }
  }

  _dismissModal = () => {
    if (this.props.onDismiss) {
      this.props.onDismiss();
    }

    Analytics.getInstance().logEvent('VIEWED_OWNED_USER_SNACKS');
  };

  render() {
    const picture = this.props.viewer?.picture;

    return (
      <ModalDialog visible={this.props.visible} onDismiss={this.props.onDismiss}>
        {picture ? (
          <div className={css(styles.avatar)}>
            <Avatar source={picture} size={80} />
          </div>
        ) : null}
        <h2 className={css(styles.heading)}>Your Snack was saved</h2>
        <p className={css(styles.text)}>
          You can now find your Snack on your profile and link others to it. Share it with your
          friends!
        </p>
        {this.props.viewer ? (
          <p className={css(styles.caption)}>
            <a
              href={`${process.env.SERVER_URL}/@${this.props.viewer.username}/snacks`}
              onClick={this._dismissModal}
              target="blank">
              View your Snacks
            </a>
          </p>
        ) : null}
      </ModalDialog>
    );
  }
}

export default ModalSuccessfulPublish;

const styles = StyleSheet.create({
  avatar: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  heading: {
    fontSize: '24px',
    fontWeight: 500,
    lineHeight: '24px',
    textAlign: 'center',
  },
  text: {
    marginBottom: 24,
    fontSize: '16px',
    padding: '0 24px 0 24px',
    lineHeight: '22px',
    textAlign: 'center',
  },
  caption: {
    fontSize: '16px',
    lineHeight: '22px',
    textAlign: 'center',
  },
});

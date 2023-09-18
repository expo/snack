import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';
import { connect } from 'react-redux';

import { c } from '../ThemeProvider';
import Button from '../shared/Button';
import ModalDialog from '../shared/ModalDialog';

type Props = {
  authFlow?: 'save1' | 'save2';
  visible: boolean;
  snackUrl?: string;
  zipUrl?: string;
  isPublishing: boolean;
  onDismiss: () => void;
  onPublish: () => void;
};

class ModalPublishToProfile extends React.Component<Props> {
  componentDidMount() {
    document.addEventListener('keydown', this._handleKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this._handleKeyDown);
  }

  _handleKeyDown = (e: KeyboardEvent) => {
    if (this.props.visible && e.keyCode === 13) {
      e.preventDefault();
      this.props.onPublish();
    }
  };

  render() {
    const copy =
      this.props.authFlow === 'save2'
        ? 'Want a stable and easy to remember URL?'
        : 'Want to easily find this snack again?';

    const cta = this.props.authFlow === 'save2' ? 'Save to your Expo Profile' : 'Save to Profile';

    return (
      <ModalDialog
        visible={this.props.visible}
        title="Save your snack"
        onDismiss={this.props.onDismiss}
      >
        <p className={css(styles.text)} style={{ marginTop: 16 }}>
          The shareable link to your Snack{' '}
          <a href={this.props.snackUrl} target="blank">
            {this.props.snackUrl}
          </a>
        </p>
        <p className={css(styles.text)}>
          Every time you save, you will get a new link to share. {copy} Log in or sign up and save
          to your profile!
        </p>
        <Button
          large
          variant="primary"
          onClick={this.props.onPublish}
          loading={this.props.isPublishing}
        >
          {cta}
        </Button>
        {this.props.zipUrl ? (
          <p className={css(styles.caption)}>
            <a className={css(styles.link)} href={this.props.zipUrl} target="blank">
              Download .zip file
            </a>
          </p>
        ) : null}
      </ModalDialog>
    );
  }
}

export default connect((state: any) => ({
  authFlow: state.splitTestSettings.authFlow || 'save1',
}))(ModalPublishToProfile);

const styles = StyleSheet.create({
  text: {
    marginBottom: 24,
    fontSize: '16px',
    padding: '0 24px 0 24px',
    lineHeight: '22px',
    textAlign: 'center',
  },
  caption: {
    marginTop: 24,
    fontSize: '16px',
    lineHeight: '22px',
    textAlign: 'center',
  },
  link: {
    color: c('primary'),
    cursor: 'pointer',
    textDecoration: 'underline',
  },
});

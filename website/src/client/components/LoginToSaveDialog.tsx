import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';
import { getLoginHref } from '../auth/login';
import withThemeName, { ThemeName } from './Preferences/withThemeName';

type Props = {
  theme: ThemeName;
};

class LoginToSaveDialog extends React.Component<Props> {
  render() {
    return (
      <div className={css(styles.container)}>
        <p className={css(styles.text)}>
          You are currently editing this Snack as a guest.
        </p>
        <p className={css(styles.text)}>
          <a href={getLoginHref()} target="blank">
            Log in
          </a>{' '}
          to save or download your changes.
        </p>
      </div>
    );
  }
}

export default withThemeName(LoginToSaveDialog);

const styles = StyleSheet.create({
  container: {
    margin: -12,
    textAlign: 'left',
  },
  text: {
    margin: 12,
  },
});

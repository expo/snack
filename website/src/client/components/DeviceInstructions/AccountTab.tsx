import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { getLoginHref } from '../../auth/login';
import withAuth, { AuthProps } from '../../auth/withAuth';
import { c } from '../ThemeProvider';

type Props = AuthProps;

function AccountTab(props: Props) {
  const { viewer } = props;
  return (
    <>
      <p>
        Download Expo Go, sign in with your Expo account and open the project from the “Projects”
        tab.
      </p>
      <p>
        {viewer ? (
          <>
            You are currently signed in as <strong>{viewer.username}</strong>.
          </>
        ) : (
          <>
            You are currently not signed in (
            <a href={getLoginHref()} className={css(styles.logInLink)}>
              Log in
            </a>
            ).
          </>
        )}
      </p>
      <div className={css(styles.previewContainer)}>
        <img
          className={css(styles.previewScreenshot)}
          src={require('../../assets/ios-instructions-preview.png')}
        />
      </div>
    </>
  );
}

export default withAuth(AccountTab);

const styles = StyleSheet.create({
  previewContainer: {
    marginBottom: '15px',
  },
  previewScreenshot: {
    height: '246px',
    width: '302px',
  },
  logInLink: {
    color: c('text'),
  },
});

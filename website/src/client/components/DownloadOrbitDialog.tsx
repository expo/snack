import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import withThemeName, { ThemeName } from './Preferences/withThemeName';

type Props = {
  theme: ThemeName;
};

class DownloadOrbitDialog extends React.Component<Props> {
  render() {
    return (
      <div className={css(styles.container)}>
        <p className={css(styles.text)}>
          It seems that you don't have Orbit installed on your computer. To download the latest
          release, please visit our{' '}
          <a href="https://github.com/expo/orbit/releases" target="blank">
            GitHub releases page
          </a>
          .
        </p>
      </div>
    );
  }
}

export default withThemeName(DownloadOrbitDialog);

const styles = StyleSheet.create({
  container: {
    margin: -12,
    textAlign: 'left',
  },
  text: {
    margin: 12,
  },
});

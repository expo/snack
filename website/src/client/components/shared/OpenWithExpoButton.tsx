import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import ButtonLink from './ButtonLink';

type Props = {
  experienceURL: string;
  onDeviceConnectionAttempt: () => void;
};

const OpenWithExpoButton = ({ experienceURL, onDeviceConnectionAttempt }: Props) => (
  <ButtonLink
    variant="primary"
    target="_blank"
    href={experienceURL}
    className={css(styles.button)}
    onClick={onDeviceConnectionAttempt}
  >
    Open with Expo Go
  </ButtonLink>
);

export default OpenWithExpoButton;

const styles = StyleSheet.create({
  button: {
    display: 'block',
  },
});

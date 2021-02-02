import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import QRCode from '../QRCode';
import { c, s } from '../ThemeProvider';
import WhyNoQrBanner from './WhyNoQrBanner';

type Props = {
  experienceURL: string;
};

export default function QRCodeTab({ experienceURL }: Props) {
  return (
    <div className={css(styles.container)}>
      <WhyNoQrBanner />
      <p>Download the Expo app on your device and scan this QR code to get started.</p>
      <div className={css(styles.qrcode)}>
        <QRCode size={200} experienceURL={experienceURL} />
      </div>
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  qrcode: {
    margin: '1em',
    height: 212,
    width: 212,
    backgroundColor: c('content', 'light'),
    borderRadius: 3,
    boxShadow: s('small'),
    padding: 6,
  },
});

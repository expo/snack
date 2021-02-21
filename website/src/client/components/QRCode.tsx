import { StyleSheet } from 'aphrodite';
import * as React from 'react';

type Props = {
  experienceURL: string;
  size?: number;
  className?: string;
};

const QRCode = ({ experienceURL, size, className }: Props) => {
  const ReactQRCode = require('qrcode.react');

  return (
    <div className={className}>
      <ReactQRCode value={experienceURL} size={size ?? 200} />
      <div style={styles.screenReaderUrl}>{experienceURL}</div>
    </div>
  );
};

const styles = StyleSheet.create({
  screenReaderUrl: {
    fontSize: 6,
    color: 'transparent',
    userSelect: 'none',
  },
});

export default QRCode;

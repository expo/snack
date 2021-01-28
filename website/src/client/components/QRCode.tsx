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
      {/* for screen readers */}
      <div style={{ fontSize: 6, color: 'transparent' }}>{experienceURL}</div>
    </div>
  );
};

export default QRCode;

import * as React from 'react';

type Props = {
  className?: string;
};

export default function WhyNoQrBanner({ className }: Props) {
  return (
    <p className={className}>
      * Expo client for iOS does not include a QR code scanner.
      <br />
      <a
        href="https://blog.expo.io/upcoming-limitations-to-ios-expo-client-8076d01aee1a"
        target="_blank">
        Read more.
      </a>
    </p>
  );
}

import { StyleSheet, css } from 'aphrodite';
import * as React from 'react';

import { c } from '../ThemeProvider';

type Props = {
  previewRef: React.MutableRefObject<Window | null>;
  previewURL: string;
  onPopupUrl: (url: string) => void;
};

export default function WebFrame({ previewRef, previewURL, onPopupUrl }: Props) {
  React.useEffect(() => onPopupUrl(previewURL), [previewURL]);

  return (
    <div className={css(styles.container)}>
      <iframe
        ref={(c) => (previewRef.current = c?.contentWindow ?? null)}
        src={previewURL}
        allow={iframePermissions}
        className={css(styles.frame)}
      />
    </div>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    display: 'flex',
    flex: 1,
    width: '100%',
    height: '100%',
  },
  frame: {
    position: 'relative',
    width: '100%',
    height: '100%',
    border: 0,
    zIndex: 1,
    backgroundColor: c('content', 'light'),
  },
});

/**
 * List of all iFrame permission directives.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy#directives
 */
const iframePermissions = [
  'accelerometer',
  'ambient-light-sensor',
  'autoplay',
  'battery',
  'camera',
  'fullscreen',
  'gamepad',
  'geolocation',
  'gyroscope',
  'idle-detection',
  'magnetometer',
  'microphone',
  'midi',
  'payment',
  'picture-in-picture',
  'screen-wake-lock',
  'usb',
].join('; ');

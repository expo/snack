import { SDKVersion } from 'snack-content';

import TransportImplWebPlayer from './TransportImplWebPlayer';
import { SnackTransport } from './types';
import { SnackWindowRef } from '../types';

export function createWebPlayerTransport(config: {
  name?: string;
  verbose?: boolean;
  webPlayerURL: string;
  window: Window;
  ref: SnackWindowRef;
}): SnackTransport {
  return new TransportImplWebPlayer(config);
}

export function getWebPlayerIFrameURL(
  webPlayerURL: string,
  sdkVersion: SDKVersion,
  initialURL: string,
  verbose: boolean,
) {
  if (sdkVersion < '40.0.0' || typeof window === 'undefined') {
    return undefined;
  }

  return `${webPlayerURL.replace(
    '%%SDK_VERSION%%',
    sdkVersion.split('.')[0],
  )}/index.html?initialUrl=${encodeURIComponent(initialURL)}&origin=${encodeURIComponent(
    window.location.origin,
  )}&verbose=${verbose}`;
}

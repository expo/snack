import { SDKVersion, SnackWindowRef } from '../types';
import {
  SnackTransport,
  SnackTransportOptions,
  SnackTransportListener,
  SnackTransportMessage,
} from './types';

export function createWebPlayerTransport(config: {
  name?: string;
  verbose?: boolean;
  webPlayerURL: string;
  window: Window;
  ref: SnackWindowRef;
  createTransport: (options: SnackTransportOptions) => SnackTransport;
}): SnackTransport {
  let transport: SnackTransport | null = null;
  function getTransport(): SnackTransport {
    transport =
      transport ??
      config.createTransport({
        name: config.name ?? 'webplayer',
        verbose: config.verbose,
      });
    return transport;
  }

  const { origin } = new URL(config.webPlayerURL);

  let windowListener: ((event: any) => void) | undefined;
  let transportListener: ((event: any) => void) | undefined;
  return {
    addEventListener: (type: 'message', listener: SnackTransportListener) => {
      if (!windowListener) {
        windowListener = (event: any) => {
          if (event.origin === origin && typeof event.data === 'string') {
            if (transport) {
              transport.postMessage({
                type: 'synthetic_event',
                data: event.data,
              });
            }
          }
        };
        config.window?.addEventListener(type, windowListener);
      }
      if (!transportListener) {
        transportListener = (event: any) => {
          const message = event;
          if (message.type === 'synthetic_event') {
            config.ref.current?.postMessage(JSON.stringify(message.data), origin);
          } else {
            listener(message);
          }
        };
      }
      getTransport().addEventListener(type, transportListener);
    },
    removeEventListener: (type: 'message', _listener: SnackTransportListener) => {
      if (windowListener) {
        config.window?.removeEventListener(type, windowListener);
        windowListener = undefined;
      }
      if (transportListener) {
        transport?.removeEventListener(type, transportListener);
        transportListener = undefined;
      }
    },
    postMessage: (message: SnackTransportMessage) => getTransport().postMessage(message),
  };
}

export function getWebPlayerIFrameURL(
  webPlayerURL: string,
  sdkVersion: SDKVersion,
  initialURL: string,
  verbose: boolean
) {
  if (sdkVersion < '40.0.0') {
    return undefined;
  }

  return `${webPlayerURL.replace(
    '%%SDK_VERSION%%',
    sdkVersion.split('.')[0]
  )}/index.html?initialUrl=${encodeURIComponent(initialURL)}&origin=${encodeURIComponent(
    window.location.origin
  )}&verbose=${verbose}`;
}

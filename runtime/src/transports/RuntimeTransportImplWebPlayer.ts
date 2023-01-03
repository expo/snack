import * as Logger from '../Logger';
import type { Device, RuntimeMessagePayload, RuntimeTransport } from './RuntimeTransport';

/**
 * The Snack web-player is served directly from S3. This means that anyone
 * can load the web-player. To prevent businesses from using the web-player
 * excessively and driving up cost, access to the web-player is limited to
 * certain origins; and to localhost to allow development.
 *
 * Security wise, this means that:
 * - Anyone can to load the web-player from S3
 * - Websites need to provide their own origin to the web-player
 *   , otherwise no communication will be possible. The origin is
 *   passed to postMessage() and used to check incomming messages.
 * - Origin is checked against a white-list of allowed origins.
 *
 * Scenarios:
 * [snack.expo.dev] -> [https://s3.webplayer?origin=snack.expo.dev] (allowed)
 * [snack.expo.dev] -> [https://s3.webplayer?origin=expo.dev] (allowed, but fails on postMessage & recv message check)
 * [badsite.com] -> [https://s3.webplayer?origin=badsite.com] (disallowed)
 * [badsite.com] -> [https://s3.webplayer?origin=snack.expo.io] (allowed, but fails on postMessage & recv message check)
 */
const allowedOrigins = [
  'https://snack.expo.io',
  'https://staging.snack.expo.io',
  'https://snack.expo.dev',
  'https://staging.snack.expo.dev',
  'http://snack.expo.test',
  'https://snack.expo.test',
  // Draftbit
  'https://build.draftbit.com',
  'https://build.stagingbit.com',
  // Codecademy
  'https://codecademy.com',
  'https://www.codecademy.com',
  'https://jackdaw.codecademy.com',
  'https://staging.codecademy.com',
  'https://production.codecademy.com',
  // Sizze
  'https://dashboard.sizze.io',
  'https://app.sizze.io',
];

function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.includes(origin) || origin.startsWith('http://localhost:');
}

type Listener = (payload: { message: any }) => void;

export default class RuntimeTransportImplWebPlayer implements RuntimeTransport {
  private _currentChannel: string | null = null;
  private readonly _device: Device;
  private readonly _listeners: Listener[] = [];
  private readonly _origin: string | undefined;
  // If we're in an iframe, grab `parent`, otherwise assume we're in popup and grab `opener`
  private readonly _parent: Window | null =
    window !== window.parent ? window.parent : window.opener;

  constructor(device: Device) {
    this._device = device;

    // The origin of the parent frame is provided in the url. This is necessary as it is not
    // possible to read the origin from the parent due to cross-origin restrictions.
    const requestedOrigin = new URL(document.URL).searchParams.get('origin') ?? '';
    if (!requestedOrigin) {
      Logger.comm_error('No origin provider in the URL');
    }
    this._origin = isAllowedOrigin(requestedOrigin) ? requestedOrigin : undefined;
    if (!this._origin) {
      Logger.comm_error(`Access to origin "${requestedOrigin} is forbidden`);
    }
  }

  subscribe(channel: string) {
    this.unsubscribe();

    if (this._origin) {
      Logger.comm('Connecting to parent');
      this._parent?.postMessage(
        JSON.stringify({ type: 'CONNECT', device: this._device }),
        this._origin
      );
      window.addEventListener('message', this.onMessage, false);
    }
  }

  unsubscribe() {
    if (this._origin) {
      Logger.comm('Disconnecting from parent');
      this._parent?.postMessage(
        JSON.stringify({ type: 'DISCONNECT', device: this._device }),
        this._origin
      );
      window.removeEventListener('message', this.onMessage, false);
    }
  }

  listen(listener: (payload: RuntimeMessagePayload) => void) {
    this._listeners.push(listener);
  }

  publish(message: object) {
    if (this._origin) {
      Logger.comm('Sending message', message);
      parent?.postMessage(
        JSON.stringify({
          type: 'MESSAGE',
          message: { ...message, device: this._device },
        }),
        this._origin
      );
    }
  }

  isConnected(): boolean {
    return parent != null;
  }

  private onMessage = (event: MessageEvent) => {
    if (!isAllowedOrigin(event.origin) || typeof event.data !== 'string') {
      return;
    }

    try {
      const message = JSON.parse(event.data);

      this._listeners.forEach((listener) => listener({ message }));
    } catch {
      Logger.comm_error('Failed to parse message', event.data);
    }
  };
}

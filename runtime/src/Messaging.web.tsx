import Constants from 'expo-constants';
import { Platform } from 'react-native';

import * as Logger from './Logger';

type Listener = (payload: { message: any }) => void;

const device = {
  id: '', // async, populated in init
  name: Constants.deviceName,
  platform: Platform.OS,
};

const listeners: Listener[] = [];

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
];

function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.includes(origin) || origin.startsWith('http://localhost:');
}

// If we're in an iframe, grab `parent`, otherwise assume we're in popup and grab `opener`
const parent: Window | null = window !== window.parent ? window.parent : window.opener;

// The origin of the parent frame is provided in the url. This is necessary as it is not
// possible to read the origin from the parent due to cross-origin restrictions.
const requestedOrigin = new URL(document.URL).searchParams.get('origin') ?? '';
if (!requestedOrigin) Logger.comm_error('No origin provider in the URL');
const origin = isAllowedOrigin(requestedOrigin) ? requestedOrigin : undefined;
if (!origin) Logger.comm_error(`Access to origin "${requestedOrigin} is forbidden`);

const onMessage = (event: MessageEvent) => {
  if (!isAllowedOrigin(event.origin) || typeof event.data !== 'string') {
    return;
  }

  try {
    const message = JSON.parse(event.data);

    listeners.forEach((listener) => listener({ message }));
  } catch (e) {
    Logger.comm_error('Failed to parse message', event.data);
  }
};

export const init = (deviceId: string) => {
  device.id = deviceId;
};

export const unsubscribe = () => {
  if (origin) {
    Logger.comm('Disconnecting from parent');
    parent?.postMessage(JSON.stringify({ type: 'DISCONNECT', device }), origin);
    window.removeEventListener('message', onMessage, false);
  }
};

export const subscribe = () => {
  unsubscribe();

  if (origin) {
    Logger.comm('Connecting to parent');
    parent?.postMessage(JSON.stringify({ type: 'CONNECT', device }), origin);
    window.addEventListener('message', onMessage, false);
  }
};

export const listen = (listener: Listener) => {
  listeners.push(listener);
};

export const publish = (message: object) => {
  if (origin) {
    Logger.comm('Sending message', message);
    parent?.postMessage(
      JSON.stringify({
        type: 'MESSAGE',
        message: { ...message, device },
      }),
      origin
    );
  }
};

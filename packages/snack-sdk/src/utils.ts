import fetchPonyfill from 'fetch-ponyfill';
import { customAlphabet } from 'nanoid';

import { SDKVersion, SnackError, SnackUser } from './types';

const { fetch } = fetchPonyfill();
export { fetch };

// + and - are used as delimiters in the uri, ensure they do not appear in the channel itself
const VALID_CHANNEL_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!_';
const generateChannel = customAlphabet(VALID_CHANNEL_CHARS, 10);

export function createChannel(channel?: string): string {
  channel = channel ?? generateChannel();

  if (channel.length < 6) {
    throw new Error('Please use a channel id with more entropy');
  }

  for (const char of channel) {
    if (VALID_CHANNEL_CHARS.indexOf(char) < 0) {
      throw new Error('Channel id contains invalid characters');
    }
  }

  return channel;
}

export function createURL(host: string, sdkVersion: SDKVersion, channel?: string, id?: string) {
  if (host.includes('snack.expo.io')) {
    host = host.replace('snack.expo.io', 'exp.host');
  } else if (host.includes('next-snack.expo.io')) {
    host = host.replace('next-snack.expo.io', 'exp.host');
  }

  if (channel) {
    return id
      ? id.startsWith('@')
        ? `exp://${host}/${id}+${channel}`
        : `exp://${host}/@snack/${id}+${channel}`
      : `exp://${host}/@snack/sdk.${sdkVersion}-${channel}`;
  } else if (id) {
    return `exp://${host}/${id.match(/.*\/.*/) ? id : `@snack/${id}`}`;
  } else {
    return '';
  }
}

export function createError(config: {
  message: string;
  name?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  stack?: string;
}): SnackError {
  const error: SnackError = new Error(config.message);
  if (config.name) error.name = config.name;
  if (config.fileName) error.fileName = config.fileName;
  if (config.lineNumber) error.lineNumber = config.lineNumber;
  if (config.columnNumber) error.columnNumber = config.columnNumber;
  if (config.stack) error.stack = config.stack;
  return error;
}

export function createUserHeader(user?: SnackUser): { [key: string]: string } {
  if (user?.sessionSecret) {
    return { 'Expo-Session': user.sessionSecret };
  }

  if (user?.accessToken) {
    return { Authorization: `Bearer ${user.accessToken}` };
  }

  return {};
}

import fetchPonyfill from 'fetch-ponyfill';
import { customAlphabet } from 'nanoid';
import { SDKVersion } from 'snack-content';

import { SnackError, SnackUser } from './types';

const { fetch } = fetchPonyfill();
export { fetch };

/**
 * All valid characters to generate a new channel ID.
 * Both `+` and `-` are used as delimiters in the classic updates URL.
 * In the new URL format, we prefer URL/sub-domain safe characters.
 */
const VALID_CHANNEL_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateChannel = customAlphabet(VALID_CHANNEL_CHARS, 10);

export function createChannel(channel?: string): string {
  channel = channel ?? generateChannel();

  if (channel.length < 6) {
    throw new Error('Please use a channel id with more characters (entropy)');
  }

  for (const char of channel) {
    if (VALID_CHANNEL_CHARS.indexOf(char) < 0) {
      throw new Error(
        `Channel id contains an invalid character "${char}", only "[0-9a-zA-Z]" are allowed`,
      );
    }
  }

  return channel;
}

export function createURL(host: string, sdkVersion: SDKVersion, channel?: string, id?: string) {
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

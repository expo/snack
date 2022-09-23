// @flow

import type { SDKVersion } from '../configs/sdkVersions';
import type { ExpoSendBeaconCloseRequest } from '../types';
import constructExperienceURL from './constructExperienceURL';

const UPDATE_FREQUENCY_SECS = 40;
let updateLoop: any = null;

type SessionOptions = {|
  name: ?string,
  snackId: ?string,
  sdkVersion: SDKVersion,
  channel: string,
  host: string,
  apiUrl: string,
  user: { idToken?: ?string, sessionSecret?: ?string },
  deviceId?: ?string,
  openedAt?: number,
  onSendBeaconCloseRequest?: (closeRequest: ExpoSendBeaconCloseRequest) => void,
|};

export async function startSessionAsync(options: SessionOptions): Promise<void> {
  if (!options.deviceId && !options.user.idToken && !options.user.sessionSecret) {
    return new Promise(() => {});
  }
  _stopKeepAlive();

  updateLoop = setInterval(() => {
    sendKeepAliveAsync(options);
  }, UPDATE_FREQUENCY_SECS * 1000);

  return sendKeepAliveAsync(options);
}

function _stopKeepAlive() {
  clearInterval(updateLoop);
  updateLoop = null;
}

export async function stopSession(options: SessionOptions): Promise<void> {
  _stopKeepAlive();
  if (options) {
    await closeAsync(options);
  }
}

export async function sendKeepAliveAsync({
  name,
  snackId,
  sdkVersion,
  channel,
  host,
  apiUrl,
  user,
  deviceId,
  openedAt,
  onSendBeaconCloseRequest,
}: SessionOptions): Promise<void> {
  if (!user && !deviceId) {
    return;
  }

  const url = constructExperienceURL({ snackId, sdkVersion, channel, host });

  const apiEndpoint = `${apiUrl}/--/api/v2/development-sessions/notify-alive`;

  const displayName = name || 'Unnamed Snack';

  const response = await authenticatedPostAsync(user, deviceId)(apiEndpoint, {
    data: {
      session: {
        description: snackId ? `${displayName} (${snackId})` : displayName,
        hostname: 'snack',
        config: {},
        url,
        source: 'snack',
        openedAt,
      },
    },
  });

  const json = await response.json();
  if (onSendBeaconCloseRequest) {
    let closeUrl = `${apiUrl}/--/api/v2/development-sessions/notify-close`;
    if (deviceId) {
      closeUrl += `?deviceId=${encodeURIComponent(deviceId)}`;
    }
    onSendBeaconCloseRequest({
      url: closeUrl,
      data: new Blob(
        [
          JSON.stringify({
            session: {
              url,
            },
            ...(json.data && json.data.auth
              ? {
                  auth: json.data.auth,
                }
              : {}),
          }),
        ],
        { type: 'text/plain' }
      ),
    });
  }
}

export async function closeAsync({
  snackId,
  sdkVersion,
  channel,
  host,
  apiUrl,
  user,
  deviceId,
}: SessionOptions): Promise<void> {
  const url = constructExperienceURL({ snackId, sdkVersion, channel, host });
  const apiEndpoint = `${apiUrl}/--/api/v2/development-sessions/notify-close`;
  await authenticatedPostAsync(user, deviceId)(apiEndpoint, {
    session: {
      url,
    },
  });
}

const authenticatedPostAsync = (user, deviceId) => async (url, body) => {
  const { idToken, sessionSecret } = user;

  const headers = {
    ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    ...(sessionSecret ? { 'Expo-Session': sessionSecret } : {}),
    'Content-Type': 'application/json',
  };

  const optionsWithAuth = {
    method: 'post',
    body: JSON.stringify(body),
    headers,
  };

  let endpoint = url;

  if (deviceId) {
    endpoint = `${url}?deviceId=${deviceId}`;
  }

  const response = await fetch(endpoint, optionsWithAuth);

  if (!response.ok) {
    throw Error(response.statusText);
  }

  return response;
};

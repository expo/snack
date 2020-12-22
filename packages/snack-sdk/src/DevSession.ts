import { Logger } from './Logger';
import { SnackState, SnackUser, SnackSendBeaconRequest } from './types';
import { fetch } from './utils';

export default class DevSession {
  private apiURL: string;
  private logger?: Logger;
  private onSendBeaconCloseRequest: (request: SnackSendBeaconRequest) => any;
  private notifyInterval: number = 40000;
  private notifyTimer?: any;
  private focusedAt?: number;

  constructor(options: {
    apiURL: string;
    logger?: Logger;
    onSendBeaconCloseRequest: (request: SnackSendBeaconRequest) => any;
  }) {
    this.apiURL = options.apiURL;
    this.logger = options.logger;
    this.onSendBeaconCloseRequest = options.onSendBeaconCloseRequest;
  }

  setState(state: SnackState, prevState: SnackState) {
    // Notify or close the session , when either:
    // 1. session-url has changed
    // 2. user has changed
    // 3. device-id has hanged

    // Close
    const isCloseUser =
      prevState.user &&
      (!state.online || state.url !== prevState.url || state.user !== prevState.user);
    const isCloseDevice =
      prevState.deviceId &&
      (!state.online || state.url !== prevState.url || state.deviceId !== prevState.deviceId);
    if (prevState.online && (isCloseUser || isCloseDevice)) {
      this.close(
        prevState.url,
        isCloseUser ? prevState.user : undefined,
        isCloseDevice ? prevState.deviceId : undefined
      );
    }

    // Notify
    if (
      state.user !== prevState.user ||
      state.online !== prevState.online ||
      state.url !== prevState.url ||
      state.deviceId !== prevState.deviceId ||
      state.onlineName !== prevState.onlineName
    ) {
      this.notify(state);
    }
  }

  setFocus(state: SnackState) {
    this.notify(state, true);
  }

  private getRequest(close: boolean, user?: SnackUser, deviceId?: string) {
    const suffix = deviceId ? `?deviceId=${deviceId}` : '';
    const endpoint = close ? 'notify-close' : 'notify-alive';
    const url = `${this.apiURL}/--/api/v2/development-sessions/${endpoint}${suffix}`;

    return {
      url,
      method: 'post',
      headers: {
        ...(user?.sessionSecret ? { 'Expo-Session': user.sessionSecret } : {}),
        'Content-Type': 'application/json',
      },
    };
  }

  private async notify(state: SnackState, setFocus?: boolean) {
    const { user, online, url: onlineURL, deviceId, onlineName } = state;

    if (this.notifyTimer) {
      clearTimeout(this.notifyTimer);
      this.notifyTimer = undefined;
    }

    if (!online || (!user && !deviceId)) {
      this.focusedAt = undefined;
      return;
    }

    if (!this.focusedAt || setFocus) {
      this.focusedAt = Date.now();
    }

    if (!this.notifyTimer) {
      this.notifyTimer = setTimeout(() => this.notify(state), this.notifyInterval);
    }

    try {
      const { url, ...data } = this.getRequest(false, user, deviceId);
      const response = await fetch(url, {
        ...data,
        body: JSON.stringify({
          data: {
            session: {
              description: onlineName,
              hostname: 'snack',
              config: {},
              url: onlineURL,
              source: 'snack',
              openedAt: this.focusedAt,
            },
          },
        }),
      });
      if (!response.ok) {
        throw Error(response.statusText);
      }

      const json = await response.json();
      this.onSendBeaconCloseRequest({
        url: this.getRequest(true, undefined, deviceId).url,
        data: new Blob(
          [
            JSON.stringify({
              session: {
                url: onlineURL,
              },
              ...(json.data?.auth
                ? {
                    auth: json.data.auth,
                  }
                : {}),
            }),
          ],
          { type: 'text/plain' }
        ),
      });
    } catch (e) {
      this.logger?.error('Failed to advertise', e);
    }
  }

  private async close(onlineURL: string, user?: SnackUser, deviceId?: string) {
    try {
      const { url, ...data } = this.getRequest(true, user, deviceId);
      const response = await fetch(url, {
        ...data,
        body: JSON.stringify({
          session: {
            url: onlineURL,
          },
        }),
      });
      if (!response.ok) {
        throw Error(response.statusText);
      }
    } catch (e) {
      this.logger?.error('Failed to advertise close', e);
    }
  }
}

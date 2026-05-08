import { Logger } from './Logger';
import { SnackState, SnackUser, SnackSendBeaconRequest } from './types';
import { createUserHeader, fetch } from './utils';

export default class DevSession {
  private apiURL: string;
  private logger?: Logger;
  private onSendBeaconCloseRequest: (request: SnackSendBeaconRequest) => any;
  private focusedAt?: number;
  private useCookieAuth: boolean;

  // NOTE(cedric): recurrent development session alive notifications are disabled
  // private notifyInterval: number = 40000;
  // private notifyTimer?: any;

  constructor(options: {
    apiURL: string;
    logger?: Logger;
    onSendBeaconCloseRequest: (request: SnackSendBeaconRequest) => any;
    useCookieAuth?: boolean;
  }) {
    this.apiURL = options.apiURL;
    this.logger = options.logger;
    this.onSendBeaconCloseRequest = options.onSendBeaconCloseRequest;
    this.useCookieAuth = options.useCookieAuth ?? false;
  }

  setState(state: SnackState, prevState: SnackState) {
    // Notify or close the session , when either:
    // 1. session-url has changed
    // 2. user has changed
    // 3. device-id has hanged

    // Close
    const urlChanged = prevState.url !== state.url;
    const deviceChanged = prevState.deviceId && prevState.deviceId !== state.deviceId;

    if (this.useCookieAuth) {
      // The SDK can't see the user identity under cookie auth — the server
      // resolves it from the cookie — so we notify unconditionally whenever
      // the session goes offline, the url changes, or the device changes.
      // Anonymous requests are a server-side no-op.
      if (prevState.online && (!state.online || urlChanged || deviceChanged)) {
        this.close(prevState.url, undefined, prevState.deviceId);
      }
    } else {
      const userChanged = prevState.user && prevState.user !== state.user;

      const closeUser = prevState.user && (!state.online || urlChanged || userChanged);
      const closeDevice = prevState.deviceId && (!state.online || urlChanged || deviceChanged);

      if (prevState.online && (closeUser || closeDevice)) {
        this.close(
          prevState.url,
          closeUser ? prevState.user : undefined,
          closeDevice ? prevState.deviceId : undefined,
        );
      }
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
    const url = `${this.apiURL}/v2/development-sessions/${endpoint}${suffix}`;

    return {
      url,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        ...(this.useCookieAuth ? {} : createUserHeader(user)),
      },
      ...(this.useCookieAuth ? { credentials: 'include' as const } : {}),
    };
  }

  private async notify(state: SnackState, setFocus?: boolean) {
    const { user, online, url: onlineURL, deviceId, onlineName } = state;

    // NOTE(cedric): recurrent development session alive notifications are disabled
    // if (this.notifyTimer) {
    //   clearTimeout(this.notifyTimer);
    //   this.notifyTimer = undefined;
    // }

    if (!online || (!this.useCookieAuth && !user && !deviceId)) {
      this.focusedAt = undefined;
      return;
    }

    if (!this.focusedAt || setFocus) {
      this.focusedAt = Date.now();
    }

    // NOTE(cedric): recurrent development session alive notifications are disabled
    // if (!this.notifyTimer) {
    //   this.notifyTimer = setTimeout(() => this.notify(state), this.notifyInterval);
    // }

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

      const json: any = await response.json();
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
          { type: 'text/plain' },
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

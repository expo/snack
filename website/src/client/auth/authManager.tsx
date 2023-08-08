import ExtendableError from 'es6-error';

import { getAuthStorageKey } from './config';
import Storage from './storage';

export enum Experiment {
  Orbit = 'ORBIT',
}

export type UserData = {
  id: string;
  username: string;
  profilePhoto: string;
  experiments: {
    id: string;
    enabled: boolean;
    experiment: Experiment;
  }[];
};

type Auth0TokenData = {
  access_token: string;
  expires_in: number;
  expires_at: number;
  scope: string;
  state: string;
  id_token: string;
  token_type: 'Bearer';
  sessionSecret: string;
};

export default class AuthenticationManager {
  private topLevelDomainCookie: Storage;
  private legacyCookie: Storage;
  public isLegacyLogoutEnabled: boolean;
  private profilePromise?: Promise<UserData | null | undefined>;

  constructor() {
    this.topLevelDomainCookie = new Storage(getAuthStorageKey(), 'cookie');
    this.legacyCookie = new Storage('io.expo.auth.snack.legacy', 'cookie');

    // Migrate legacy cookies from 'io.expo.auth' to 'io.expo.auth.snack.legacy'
    this.migrateLegacyCookies(['sessionSecret', 'tokenData']);

    this.isLegacyLogoutEnabled = !!(
      this.legacyCookie.getItem('sessionSecret') ?? this.legacyCookie.getItem('tokenData')
    );
  }

  private migrateLegacyCookies(names: string[]) {
    names.forEach((name) => {
      const value = this.topLevelDomainCookie.getItem(name);
      if (value) {
        // When a cookie is found, it is unknown whether the cookie
        // was stored by the top-level domain (expo.io), or by the Snack
        // web-app itself (snack.expo.io).
        // In this case, we attempt to delete the cookie. If the removal
        // was succesful, the cookie was not from the top-level domain, but
        // in fact a legacy cookie from snack.expo.io. In that case, move
        // the cookie to a legacy bucket so its easier to detect.
        this.topLevelDomainCookie.removeItem(name);
        const newValue = this.topLevelDomainCookie.getItem(name);
        if (!newValue) {
          // When the cookie was succesfully deleted, move it
          // to the legacy bucket.
          this.legacyCookie.setItem(name, value);
        } else if (this.legacyCookie.getItem(name)) {
          // When the cookie could NOT be deleted, it is stored at the top
          // level domain. In that case clear out all legacy cookies, as the
          // user is already using top-level domain auth.
          this.legacyCookie.removeItem(name);
        }
      }
    });
  }

  private getCookie(name: string): string | null | undefined {
    return this.topLevelDomainCookie.getItem(name) ?? this.legacyCookie.getItem(name);
  }

  async getProfile() {
    if (this.profilePromise) {
      return this.profilePromise;
    }

    this.profilePromise = this._getUserProfile();
    try {
      const profile = await this.profilePromise;
      this.profilePromise = undefined;
      return profile;
    } catch (err) {
      this.profilePromise = undefined;
      throw err;
    }
  }

  async legacyLogout() {
    this.clearLegacyTokenData();
    this.clearLegacySessionSecretData();
    this.isLegacyLogoutEnabled = false;
  }

  get sessionSecret(): string | null {
    const rawSessionData = this.getCookie('sessionSecret');
    if (!rawSessionData) {
      return null;
    }
    try {
      const sessionSecret = JSON.parse(rawSessionData);
      if (Date.now() >= sessionSecret.expires_at) {
        throw new Error('Expired');
      }
      return JSON.stringify(sessionSecret);
    } catch (e) {
      this.clearLegacySessionSecretData();
      return null;
    }
  }

  private clearLegacySessionSecretData() {
    this.legacyCookie.removeItem('sessionSecret');
  }

  get accessToken(): string | null {
    const tokenData = this.getTokenData();
    if (tokenData) {
      if (this.isTokenValid(tokenData)) {
        return tokenData.access_token;
      }
      this.clearLegacyTokenData();
      return null;
    }
    return null;
  }

  get idToken(): string | null {
    const tokenData = this.getTokenData();
    if (tokenData) {
      if (this.isTokenValid(tokenData)) {
        return tokenData.id_token;
      }
      this.clearLegacyTokenData();
      return null;
    }
    return null;
  }

  private isTokenValid(tokenData: Auth0TokenData): boolean {
    return Date.now() < tokenData.expires_at;
  }

  private getTokenData(): Auth0TokenData | undefined | null {
    const rawTokenData = this.getCookie('tokenData');
    if (rawTokenData) {
      try {
        return JSON.parse(rawTokenData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  private clearLegacyTokenData() {
    this.legacyCookie.removeItem('tokenData');
  }

  _getUserProfile = _handleApiErrors(async () => {
    const { idToken, sessionSecret } = this;

    // if auth0 token set and session secret is missing, return null
    if (!idToken && !sessionSecret) {
      return null;
    }

    const result: { data?: { me: UserData } } = await _performGraphQLApiRequest(
      {
        query: `{
          me {
            id
            username
            profilePhoto
            experiments {
              id
              enabled
              experiment
            }
          }
        }`,
      },
      {
        headers: {
          ...(sessionSecret ? { 'Expo-Session': sessionSecret } : {}),
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
      }
    );

    return result.data?.me;
  });
}

function _handleApiErrors<F extends Function>(fn: F): F {
  // @ts-ignore
  return async (...args) => {
    const ourFault = 'Something on our end broke! We are so sorry about this. Try again later';
    try {
      const response: any = await fn(...args);
      if (!response) {
        throw new GenericError(ourFault);
      }
      if (!!response.errors && response.errors.length) {
        const error = response.errors[0];
        const errorMessage = error.details ? error.details.message : error.message;
        throw new ApiError(errorMessage);
      }
      return response;
    } catch (e) {
      if (e instanceof ApiError || e instanceof GenericError) {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw e;
      }
      throw new GenericError(ourFault);
    }
  };
}

/**
 * Generic helper method to perform an request to the Expo GraphQL API
 */
async function _performGraphQLApiRequest<T>(
  body: object | null,
  options?: { headers?: { [key: string]: string } }
): Promise<T> {
  const customHeaders = options?.headers ?? {};
  if (options) {
    delete options.headers;
  }
  const response = await fetch(`${process.env.API_SERVER_URL}/--/graphql`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    body:
      body &&
      JSON.stringify({
        ...body,
      }),
    ...(options ?? {}),
  });
  return response.json();
}

class GenericError extends ExtendableError {}
class ApiError extends ExtendableError {}

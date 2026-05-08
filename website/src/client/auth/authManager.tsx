import ExtendableError from 'es6-error';

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

export default class AuthenticationManager {
  private profilePromise?: Promise<UserData | null | undefined>;

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

  _getUserProfile = _handleApiErrors(async () => {
    const result: { data?: { me: UserData } } = await _performGraphQLApiRequest({
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
    });

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
 * Generic helper method to perform an request to the Expo GraphQL API.
 * Uses `credentials: 'include'` so the browser attaches the auth cookie.
 */
async function _performGraphQLApiRequest<T>(body: object | null): Promise<T> {
  const response = await fetch(`${process.env.API_SERVER_URL}/graphql`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
  return response.json();
}

class GenericError extends ExtendableError {}
class ApiError extends ExtendableError {}

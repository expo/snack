import nullthrows from 'nullthrows';
import { standardizeDependencies } from 'snack-sdk';
import { GetServerSidePropsContext } from 'next';
import Cookies from 'cookies';

import { RouterData } from './types';

function getAuthStorageKey() {
  return process.env.DEPLOY_ENVIRONMENT === 'staging' ? 'staging.expo.auth' : 'io.expo.auth';
}

export default async function fetchSnack(
  context: GetServerSidePropsContext,
  id: string
): Promise<RouterData> {
  let data: RouterData;
  try {
    const cookies = new Cookies(context.req, context.res);
    const expoSession = cookies.get(`${getAuthStorageKey()}.sessionSecret`);

    const response = await fetch(
      `${nullthrows(process.env.API_SERVER_URL)}/--/api/v2/snack/${id}`,
      {
        headers: {
          'Snack-Api-Version': '3.0.0',
          ...(expoSession ? { 'expo-session': decodeURIComponent(expoSession) } : {}),
        },
      }
    );

    const text = await response.text();
    const json = JSON.parse(text);

    if (json.errors?.length) {
      return {
        type: 'error',
        id,
        error: { message: 'Server returned errors when fetching data' },
        // defaults,
      };
    } else {
      return {
        type: 'success',
        id,
        snack: {
          ...json,
          // Convert dependencies from V1 and V2 formats to the latest format
          dependencies: standardizeDependencies(json.dependencies),
        },
        // defaults,
      };
    }
  } catch (error) {
    return {
      type: 'error',
      id,
      error: { message: error.message },
      // defaults,
    };
  }
}

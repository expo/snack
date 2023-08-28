import assert from 'assert';
import Constants from 'expo-constants';

/**
 * The detected Snack environment based on the `manifest.extra.cloudEnv` setting.
 * This defaults to `production` if not set.
 */
export const SNACK_ENVIRONMENT: 'staging' | 'production' =
  Constants.manifest?.extra?.cloudEnv ?? 'production';

assert(
  ['staging', 'production'].includes(SNACK_ENVIRONMENT),
  'Invalid Snack environment set through `manifest.extra.cloudEnv`, must be "staging" or "production".'
);

/** Get the value based on the detected Snack environment. */
export function getSnackEnvironmentValue<T extends any>(
  values: Record<typeof SNACK_ENVIRONMENT, T>
): T {
  return values[SNACK_ENVIRONMENT];
}

/** The Snack or Expo API endpoint. */
export const SNACK_API_URL = getSnackEnvironmentValue({
  production: 'https://exp.host',
  staging: 'https://staging.exp.host',
});

/**
 * The Snackager Cloudfront endpoints to try before failing.
 * Note, staging may fail randomly due to reduced capacity or general development work.
 * Because of that, we try both staging and production before failing.
 */
export const SNACKAGER_API_URLS = getSnackEnvironmentValue({
  production: ['https://d37p21p3n8r8ug.cloudfront.net'],
  staging: [
    'https://ductmb1crhe2d.cloudfront.net', // staging
    'https://d37p21p3n8r8ug.cloudfront.net', // production
  ],
});

/** The SnackPub endpoint, used to establish socket connections with the Snack Website. */
export const SNACKPUB_URL = getSnackEnvironmentValue({
  production: 'https://snackpub.expo.dev',
  staging: 'https://staging-snackpub.expo.dev',
});

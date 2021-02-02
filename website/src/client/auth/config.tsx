export function getAuthStorageKey() {
  return process.env.DEPLOY_ENVIRONMENT === 'staging' ? 'staging.expo.auth' : 'io.expo.auth';
}

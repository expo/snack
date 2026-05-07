export function getAuthStorageKey() {
  switch (process.env.DEPLOY_ENVIRONMENT) {
    case 'development':
      return 'local.expo.auth';
    case 'staging':
      return 'staging.expo.auth';
    case 'production':
    default:
      return 'io.expo.auth';
  }
}

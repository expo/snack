import { isDevDomainEnabled } from '../../expo-dev-migration';

export function getWebsiteURL() {
  return isDevDomainEnabled() ? process.env.SERVER_URL : process.env.LEGACY_SERVER_URL;
}

export function getSnackWebsiteURL() {
  return isDevDomainEnabled() ? process.env.SNACK_SERVER_URL : process.env.LEGACY_SNACK_SERVER_URL;
}

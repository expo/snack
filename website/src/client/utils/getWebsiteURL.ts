import { isExpoDevEnabled } from 'src/expo-dev-migration';

export function getWebsiteURL() {
  const isExpoDevRedirectEnabled = isExpoDevEnabled();

  return isExpoDevRedirectEnabled ? process.env.WEBSITE_URL : process.env.SERVER_URL;
}

export function getSnackWebsiteURL() {
  const isExpoDevRedirectEnabled = isExpoDevEnabled();

  return isExpoDevRedirectEnabled
    ? process.env.SNACK_DOT_DEV_SERVER_URL
    : process.env.SNACK_SERVER_URL;
}

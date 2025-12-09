const assert = require('assert');
const { version: expoVersion } = require('expo/package.json');
const { string } = require('getenv');
const { major } = require('semver');

/**
 * @param {object} params
 * @param {import('expo/config').ExpoConfig} params.config
 * @returns {import('expo/config').ExpoConfig}
 */
module.exports = ({ config }) => {
  // This is needed for cannary runtimes to work in development versions of future Expo Go releases.
  // E.g. 55.0.0-canary -> sdkVersion: 55.0.0 won't work in Expo Go until 55.0.0 is released.
  config.sdkVersion = '54.0.0';
  // UNVERSIONED doesn't work with EAS Update, so I force 54 to avoid issue with loading the runtime
  // due to version mismatch.

  // Set web export prefix major Expo SDK version.
  // This is used to properly host the web build on Snack's S3 hosting.
  config.experiments ||= {};
  config.experiments.baseUrl = `/v2/${major(expoVersion)}`;

  const projectId = string('EXPO_PROJECT_ID', null);

  // Dynamically configure the EAS project ID, if not configured yet.
  if (!config.extra?.eas?.projectId) {
    assert(projectId, 'Environment variable "EXPO_PROJECT_ID" is required');

    config.extra ||= {};
    config.extra.eas ||= {};
    config.extra.eas.projectId = projectId;
  }

  // Dynamically configure the EAS endpoint, if not configured yet.
  if (!config.updates?.url) {
    assert(projectId, 'Environment variable "EXPO_PROJECT_ID" is required');

    config.updates ||= {};

    if (string('EXPO_PUBLIC_SNACK_ENV') === 'staging') {
      config.updates.url = `https://staging-u.expo.dev/${projectId}`;
    } else {
      config.updates.url = `https://u.expo.dev/${projectId}`;
    }
  }

  return config;
};

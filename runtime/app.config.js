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
  // Set app version to major Expo SDK version.
  // This is used for EAS Updates to launch the correct bundle.
  config.version = `${major(expoVersion)}.0.0`;
  config.runtimeVersion ||= {};
  config.runtimeVersion.policy = 'appVersion';

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

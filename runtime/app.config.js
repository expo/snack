const assert = require('assert');
const { string } = require('getenv');

/**
 * @param {object} params
 * @param {import('expo/config').ExpoConfig} params.config
 * @returns {import('expo/config').ExpoConfig}
 */
module.exports = ({ config }) => {
  // Set correct cloudenv for the app
  config.extra ||= {};
  config.extra.cloudEnv = process.env.CLOUD_ENV ?? process.env.EXPO_PUBLIC_SNACK_ENV;

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

const { version: expoVersion } = require('expo/package.json');
const { major } = require('semver');

/**
 * @param {object} params
 * @param {import('expo/config').ExpoConfig} params.config
 * @returns {import('expo/config').ExpoConfig}
 */
module.exports = ({ config }) => {
  // Set web export prefix major Expo SDK version.
  // This is used to properly host the web build on Snack's S3 hosting.
  config.experiments ||= {};
  config.experiments.baseUrl = `/v2/${major(expoVersion)}`;

  return config;
};

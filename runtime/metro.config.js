// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { boolish } = require('getenv');

/* eslint-env node */
const config = getDefaultConfig(__dirname);

// Workaround for paths hosting web on a subdirectory (https://<s3-bucket>/v2/<expo-sdk-version>/)
if (boolish('SNACK_EXPORT_WEB', false)) {
  const expoVersion = require('expo/package.json').version;
  const semver = require('semver');

  config.transformer.publicPath = `/v2/${semver.major(expoVersion)}/assets`;
}

module.exports = config;

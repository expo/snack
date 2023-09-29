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

  // Error: While trying to resolve module `@socket.io/component-emitter` from file `/runtime/node_modules/socket.io-parser/build/esm/index.js`,
  // the package `/runtime/node_modules/@socket.io/component-emitter/package.json` was successfully found.
  // However, this package itself specifies a `main` module field that could not be resolved
  config.resolver.sourceExts.push('mjs');
}

module.exports = config;

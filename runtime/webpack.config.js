/* eslint-env node */

const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(Object.assign({}, env, { pwa: false }), argv);

  config.plugins = config.plugins.filter(
    (p) =>
      // This plugin causes issue with production builds
      p.constructor.name !== 'WebpackDeepScopeAnalysisPlugin' &&
      // We don't need PWA support for now\
      // Leaving this enabled produces a broken manifest link for sub paths
      p.constructor.name !== 'WebpackPwaManifest'
  );

  // We serve the app under a subpath
  // By default `publicPath` is set to '/' which breaks our links
  config.output.publicPath = '';

  config.plugins.find((p) => p.constructor.name === 'HtmlWebpackPlugin').options.favicon =
    path.join(__dirname, 'assets', 'favicon.png');

  config.plugins.find(
    (p) => p.constructor.name === 'InterpolateHtmlPlugin'
  ).replacements.PUBLIC_URL = '';

  config.plugins.find((p) => p.constructor.name === 'ManifestPlugin').opts.publicPath = '';

  return config;
};

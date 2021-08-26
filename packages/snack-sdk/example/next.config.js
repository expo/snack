const path = require('path');

module.exports = {
  reactStrictMode: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.alias['snack-sdk'] = path.resolve(__dirname, '../../../packages/snack-sdk');
    return config;
  },
};

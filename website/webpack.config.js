/* eslint-disable import/no-commonjs */

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const { StatsWriterPlugin } = require('webpack-stats-plugin');
const WorkerPlugin = require('worker-plugin');

function env(key, def) {
  const value = process.env[key];

  if (value !== undefined) {
    return value;
  }

  throw new Error(`Environment variable ${key} isn't specified`);
}

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  entry: {
    // Main bundle
    app: './src/client/index.tsx',

    // Service worker
    sw: './src/client/sw.tsx',
  },
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: '[name].bundle.js',
    chunkFilename: '[id].[hash].chunk.cached.js',
  },
  optimization: {
    noEmitOnErrors: true,
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        exclude: /eslint_bundle/,
        parallel: true,
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        SERVER_URL: JSON.stringify(env('SERVER_URL')),
        LEGACY_SERVER_URL: JSON.stringify(env('LEGACY_SERVER_URL')),
        API_SERVER_URL: JSON.stringify(env('API_SERVER_URL')),
        RUDDERSTACK_DATA_PLANE_URL: JSON.stringify(env('RUDDERSTACK_DATA_PLANE_URL')),
        RUDDERSTACK_WRITE_KEY: JSON.stringify(env('RUDDERSTACK_WRITE_KEY')),
        SNACK_AMPLITUDE_KEY: JSON.stringify(env('SNACK_AMPLITUDE_KEY')),
        LEGACY_SNACK_SERVER_URL: JSON.stringify(env('LEGACY_SNACK_SERVER_URL')),
        SNACK_SERVER_URL: JSON.stringify(env('SNACK_SERVER_URL')),
        SNACK_WEBPLAYER_URL: JSON.stringify(env('SNACK_WEBPLAYER_URL')),
        IMPORT_SERVER_URL: JSON.stringify(env('IMPORT_SERVER_URL')),
        DEPLOY_ENVIRONMENT: JSON.stringify(env('DEPLOY_ENVIRONMENT')),
        BUILD_TIMESTAMP: JSON.stringify(Date.now()),
      },
    }),
    new webpack.IgnorePlugin(
      /^((fs)|(path)|(os)|(crypto)|(source-map-support))$/,
      /vs(\/|\\)language(\/|\\)typescript(\/|\\)lib/
    ),
    new webpack.ContextReplacementPlugin(
      /monaco-editor(\\|\/)esm(\\|\/)vs(\\|\/)editor(\\|\/)common(\\|\/)services/
    ),
    new WorkerPlugin(),
    new MiniCssExtractPlugin(),
    new StatsWriterPlugin({
      filename: 'build-stats.js',
      fields: ['hash', 'assets', 'assetsByChunkName'],
      transform: ({ hash, assets, assetsByChunkName }) => `
        // This script is used in the service worker
        self.__WEBPACK_BUILD_STATS__ = ${JSON.stringify({
          hash,
          entry: assetsByChunkName.app[0],
          assets: assets.map((a) => `/dist/${a.name}`).filter((a) => !a.endsWith('.map')),
        })}
      `,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|tsx?)$/,
        exclude: /(node_modules|(vendor\/.+\.js))/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'assets/',
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      aphrodite: 'aphrodite/no-important',
      'snack-content': path.resolve(__dirname, '../packages/snack-content/src'),
      'snack-sdk': path.resolve(__dirname, '../packages/snack-sdk/src'),
    },
  },
};

const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const {
  /** Enable the bundle analyzer to validate the output after updating */
  WEBPACK_ANALYZE,
  /** Enable production mode to output the most optimized bundle */
  WEBPACK_PRODUCTION,
} = process.env;

/**
 * This configuration is based on ESLint's and the playground webpack config
 * It creates a standalone file to use in the Snack Website.
 *
 * @type {import('webpack').Configuration}
 */
const config = {
  mode: 'development',
  entry: {
    system: path.resolve(__dirname, 'src/system.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    // library: 'eslint-standalone', // This causes a weird export
    libraryTarget: 'commonjs2',
    globalObject: 'this',
  },
  plugins: [new NodePolyfillPlugin()],
  module: {
    rules: [
      {
        test: /\.(ts|js|mjs)$/u,
        include: [path.resolve(__dirname, 'src')],
        exclude: [path.resolve(__dirname, 'node_modules')],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-typescript',
              '@babel/preset-env',
            ],
          },
        },
      },
    ],
  },
  stats: 'errors-only',
  resolve: {
    extensions: ['.js', '.ts'],
    mainFields: ['browser', 'main', 'module'],
    fallback: {
      fs: false,
    },
  },
  externals: {
    // This "hot-wires" snack babel standalone, bundled with presets and plugins.
    // It's required for the `@babel/eslint-parser` to resolve the right libraries.
    // We don't use aliases, because we want to be able to split it in chunks in Snack Website.
    // '@babel/core': 'commonjs2 snack-babel-standalone/eslint',
  },
};

// We want to optimize the bundle output to minimize the size of the bundle
if (WEBPACK_PRODUCTION || WEBPACK_ANALYZE) {
  config.mode = 'production';
  config.devtool = false;
  config.optimization = {
    minimize: true,
  };

  // We want to be able to analyze the bundle size, in case we need to update it
  if (WEBPACK_ANALYZE) {
    config.plugins.push(new BundleAnalyzerPlugin());
  }
}

module.exports = config;

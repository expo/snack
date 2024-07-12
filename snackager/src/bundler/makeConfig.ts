import uniq from 'lodash/uniq';
import { snackRequireContextVirtualModuleBabelPlugin } from 'snack-require-context/snackager';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';

import RewriteImportsPlugin from './RewriteImportsPlugin';
import { getCoreExternals, getPackageExternals } from './externals';
import getResolverConfig from './getResolverConfig';

type Options = {
  root: string;
  entry: string;
  output: {
    path: string;
    filename: string;
    library: string;
    // TODO: check if other properties are required
    publicPath?: string; // from ./utils/packageBundle
  };
  externals: string[];
  platform: string;
  reanimatedPlugin?: boolean;
  expoRouterPlugin?: boolean;
};

export default ({
  root,
  entry,
  output,
  externals,
  platform,
  reanimatedPlugin,
  expoRouterPlugin,
}: Options): webpack.Configuration => {
  return {
    context: root,
    mode: 'production',
    entry,
    output: {
      ...output,
      libraryTarget: 'commonjs',
    },
    optimization: {
      moduleIds: 'size',
      emitOnErrors: false,
      minimize: true,
      // Explicitly configure the Terser plugin to not generate "bundle.js.LICENSE.txt" files
      // https://stackoverflow.com/questions/64818489/webpack-omit-creation-of-license-txt-files
      minimizer: [new TerserPlugin({ extractComments: false })],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': { NODE_ENV: JSON.stringify('production') },
        __DEV__: JSON.stringify(false),
      }),
    ],
    module: {
      rules: [
        {
          test: /\.[cm]?(js|tsx?)$/,
          type: 'javascript/auto',
          parser: {
            requireEnsure: false,
            fullySpecified: false,
          },
        },
        {
          test: /\.[cm]?(js|tsx?)$/,
          use: {
            loader: require.resolve('babel-loader'),
            options: {
              babelrc: false,
              configFile: false,
              presets: [
                require.resolve('@babel/preset-typescript'),
                [
                  require.resolve('@react-native/babel-preset'),
                  {
                    // Disable the implicit plugin-transform-runtime and add ourselves in the plugins list
                    enableBabelRuntime: false,
                  },
                ],
              ],
              plugins: [
                RewriteImportsPlugin,
                require.resolve('@babel/plugin-transform-export-namespace-from'),
                [
                  require.resolve('@babel/plugin-transform-runtime'),
                  {
                    helpers: true,
                    regenerator: true,
                    version: require('@babel/runtime/package.json').version,
                  },
                ],
                ...(reanimatedPlugin ? [require.resolve('react-native-reanimated/plugin')] : []),
                ...(expoRouterPlugin ? [snackRequireContextVirtualModuleBabelPlugin] : []),
              ],
            },
          },
        },
        {
          test: /\.(bmp|gif|jpg|jpeg|png|svg|mp4|ttf|otf)$/,
          use: {
            loader: require.resolve('./assetLoader'),
            options: { platform, root },
          },
        },
      ],
    },
    externals: [
      ...uniq([...externals, ...getCoreExternals(), ...getPackageExternals()]),
      ({ request }, callback) => {
        // Mark the Expo Router entry point as external
        if (expoRouterPlugin && request?.startsWith('module://app')) {
          return callback(undefined, 'commonjs ' + request);
        }

        // Mark imports such as react-native-gesture-handler/DrawerLayout to be external
        // Otherwise it will pull in the whole library
        if (/^react-native-gesture-handler\/[^/]+$/.test(request!)) {
          return callback(undefined, 'commonjs ' + request);
        }

        // Mark both the `react-native-vector-icons` _and_ `@expo/vector-icons` as external, including any nested require
        // This allows us to mark `react-native-vector-icons/MaterialCommunityIcons` as external
        // Both these libraries have special hardcoded handling in the Snack runtime (in modules)
        if (/react-native-vector-icons(\/.*)?/.test(request!)) {
          return callback(undefined, 'commonjs ' + request);
        }
        if (/@expo\/vector-icons(\/.*)?/.test(request!)) {
          return callback(undefined, 'commonjs ' + request);
        }

        callback();
      },
    ],
    resolve: getResolverConfig(platform),
  };
};

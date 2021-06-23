import uniq from 'lodash/uniq';
import webpack from 'webpack';

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
};

export default ({
  root,
  entry,
  output,
  externals,
  platform,
  reanimatedPlugin,
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
      noEmitOnErrors: true,
      minimize: true,
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': { NODE_ENV: JSON.stringify('production') },
        __DEV__: JSON.stringify(false),
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        debug: false,
      }),
    ],
    module: {
      rules: [
        { parser: { requireEnsure: false } },
        {
          test: /\.(m?js|tsx?)$/,
          use: {
            loader: require.resolve('babel-loader'),
            options: {
              babelrc: false,
              configFile: false,
              presets: [require.resolve('metro-react-native-babel-preset')],
              plugins: [
                ...(reanimatedPlugin ? [require.resolve('react-native-reanimated/plugin')] : []),
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
      (_context: any, request: any, callback: Function) => {
        // Mark imports such as react-native-gesture-handler/DrawerLayout to be external
        // Otherwise it will pull in the whole library
        if (/^react-native-gesture-handler\/[^/]+$/.test(request)) {
          return callback(null, 'commonjs ' + request);
        }

        // Mark both the `react-native-vector-icons` _and_ `@expo/vector-icons` as external, including any nested require
        // This allows us to mark `react-native-vector-icons/MaterialCommunityIcons` as external
        // Both these libraries have special hardcoded handling in the Snack runtime (in modules)
        if (/react-native-vector-icons(\/.*)?/.test(request)) {
          return callback(null, 'commonjs ' + request);
        }
        if (/@expo\/vector-icons(\/.*)?/.test(request)) {
          return callback(null, 'commonjs ' + request);
        }

        callback();
      },
    ],
    resolve: getResolverConfig(platform),
  };
};

module.exports = (api) => {
  const isWebpack = api.caller((caller) => Boolean(caller && caller.name === 'babel-loader'));

  return {
    presets: [
      [
        '@babel/preset-env',
        isWebpack
          ? {
              targets: {
                browsers: [
                  '>0.25%',
                  'not dead',
                  'not ie 11',
                  'not op_mini all',
                  'not android <= 4.4',
                  'not samsung <= 4',
                ],
              },
              exclude: ['transform-typeof-symbol'],
              useBuiltIns: 'usage',
              corejs: 3,
              modules: false,
            }
          : {
              targets: {
                node: '12.16',
              },
            },
      ],
      '@babel/preset-react',
      '@babel/preset-typescript',
    ],
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-class-properties',
      'lodash',
      ...(isWebpack
        ? [
            'webpack-chunkname', // for code splitting
          ]
        : [
            'dynamic-import-node', // to transpile import() to a deferred require()
            [
              'file-loader', // to transpile require(image) to a url
              {
                name: '[hash].[ext]',
                extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg'],
                publicPath: '/dist/assets',
                outputPath: '/build/assets',
                context: '',
                limit: 0,
              },
            ],
          ]),
    ],
    overrides: [
      {
        test: './src/client/vendor',
        compact: true,
      },
    ],
  };
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      // '@babel/preset-typescript', // See: https://github.com/software-mansion/react-native-reanimated/issues/5112#issuecomment-1864747318
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};

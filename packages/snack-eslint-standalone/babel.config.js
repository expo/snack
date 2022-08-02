module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      '@babel/preset-typescript',
      [
        '@babel/preset-env',
        {
          /*
          * We want to remove `transform-unicode-regex` convert because of https://github.com/eslint/eslint/pull/12662.
          *
          * With `>0.5%`, `@babel/preset-env@7.7.6` prints below:
          *
          *     transform-unicode-regex { "chrome":"49", "ie":"11", "safari":"5.1" }
          *
          * So this excludes those versions:
          *
          * - IE 11
          * - Chrome 49 (2016; the last version on Windows XP)
          * - Safari 5.1 (2011-2013; the last version on Windows)
          */
          targets: '>0.5%, not chrome 49, not ie 11, not safari 5.1',
        },
      ],
    ],
  };
};

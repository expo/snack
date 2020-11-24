module.exports = {
  root: true,
  plugins: ['flowtype'],
  extends: ['universe/node', 'universe/web', 'plugin:flowtype/recommended'],
  globals: {
    window: true,
    navigator: true,
  },
  env: {
    jasmine: true,
  },
  rules: {
    'flowtype/no-types-missing-file-annotation': 0,
    'flowtype/space-after-type-colon': 0,
  },
};

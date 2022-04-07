const { jsExtensions, tsExtensions } = require('eslint-config-universe/shared/extensions');

module.exports = {
  extends: 'universe/node',
  // This project does not contain babel, force all files to use the typescript parser instead.
  parser: '@typescript-eslint/parser',
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': [...jsExtensions, ...tsExtensions],
    },
  },
};

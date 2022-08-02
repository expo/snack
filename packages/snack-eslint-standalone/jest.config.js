const path = require('path');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  roots: [path.resolve('./src')],
  testMatch: [
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
  moduleNameMapper: {
    // This "hot-wires" snack babel standalone, see webpack for more info.
    '@babel/core': require.resolve('snack-babel-standalone/eslint'),
  },
};

const path = require('path');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest',
  rootDir: path.resolve(__dirname, '..'),
  testRegex: '/__tests__/.*\\.test\\.(js|tsx?)$',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest/unit.setup.js'],
  moduleNameMapper: {
    'snack-sdk': '<rootDir>../packages/snack-sdk/src',
  },
};

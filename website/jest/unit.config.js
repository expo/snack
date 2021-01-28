const path = require('path');

module.exports = {
  preset: 'ts-jest',
  rootDir: path.resolve(__dirname, '..'),
  testRegex: '/__tests__/.*\\.test\\.(js|tsx?)$',
  setupFilesAfterEnv: ['<rootDir>/jest/unit.setup.js'],
  moduleNameMapper: {
    'snack-sdk': '<rootDir>../packages/snack-sdk/src',
  },
};

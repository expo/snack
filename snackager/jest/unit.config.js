const path = require('path');

module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  rootDir: path.resolve(__dirname, '..'),
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest/unit.setup.js'],
  moduleNameMapper: {
    'snack-sdk': '<rootDir>../packages/snack-sdk/src',
  },
};

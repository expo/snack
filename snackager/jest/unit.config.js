const path = require('path');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  rootDir: path.resolve(__dirname, '..'),
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest/unit.setup.js'],
  testMatch: ['**/__tests__/**/*.(spec|test).[tj]s?(x)'],
};

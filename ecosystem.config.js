const path = require('path');

const interpreter = path.resolve(__dirname, 'node_modules/.bin/ts-node-dev');

module.exports = {
  apps: [
    {
      name: 'snack-website',
      script: `./src/server/index.tsx`,
      interpreter,
      interpreter_args: '--require tsconfig-paths/register --inspect=9211',
      cwd: 'website',
    },
    {
      name: 'exp-www-proxy',
      script: `./src/index.ts`,
      interpreter,
      interpreter_args: '--inspect=9220',
      cwd: 'packages/expo-www-proxy',
    },
    {
      name: 'exp-web-proxy',
      script: `./src/index.ts`,
      interpreter,
      interpreter_args: '--inspect=9221',
      cwd: 'packages/expo-website-proxy',
    },
    /* {
      name: 'snack-bundler-proxy',
      script: './src/index.ts',
      interpreter,
      interpreter_args: '--inspect=9222',
      cwd: 'packages/snack-bundler-proxy',
    }, */
  ],
};

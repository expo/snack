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
      name: 'snack-proxies',
      script: `./src/index.ts`,
      interpreter,
      interpreter_args: '--inspect=9220',
      cwd: 'packages/snack-proxies',
    },
  ],
};

import chalk from 'chalk';

import { createProxy } from './proxy';

createProxy({
  name: 'snackager',
  port: 3022,
  localURL: 'http://localhost:3012',
  stagingURL: 'https://staging-snackager.eascdn.net',
}).then(
  () => console.log(chalk.green('Snackager proxy started')),
  (err) => console.error(chalk.red(`Failed to start snackager proxy (${err})`)),
);

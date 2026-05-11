import chalk from 'chalk';

import { createProxy } from './proxy';

Promise.all([
  createProxy({
    name: 'expo-www',
    port: 3020,
    localURL: 'http://localhost:3000',
    stagingURL: 'https://staging.exp.host',
  }),
  createProxy({
    name: 'snackager',
    port: 3022,
    localURL: 'http://localhost:3012',
    stagingURL: 'https://staging-snackager.eascdn.net',
  }),
]).then(
  () => console.log(chalk.green('All proxies started')),
  (err) => console.error(chalk.red(`Failed to start proxies (${err})`)),
);

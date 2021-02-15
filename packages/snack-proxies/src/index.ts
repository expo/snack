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
    name: 'expo-website',
    port: 3021,
    localURL: 'http://localhost:3001',
    stagingURL: 'https://staging.expo.io',
  }),
]).then(
  () => console.log(chalk.green('All proxies started')),
  (err) => console.error(chalk.red(`Failed to start proxies (${err})`))
);

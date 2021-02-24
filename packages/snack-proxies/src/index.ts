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
  createProxy({
    name: 'snackager',
    port: 3022,
    localURL: 'http://localhost:3012',
    stagingURL: 'https://staging.snackager.expo.io',
  }),
  /* createProxy({
    name: 'webplayer',
    port: 3023,
    localURL: 'http://localhost:19006',
    localPathResolver: (_ctx, path) => path.replace(/^\/\d+\//, '/'),
    stagingURL: 'https://snack-web-player-staging.s3.us-west-1.amazonaws.com',
  }),
  createProxy({
    name: 'webplayer-cdn',
    port: 3024,
    localURL: 'http://localhost:19006',
    localPathResolver: (_ctx, path) => path.replace(/^\/\d+\//, '/'),
    stagingURL: 'https://d1qt8af2b3kxj0.cloudfront.net',
  }), */
]).then(
  () => console.log(chalk.green('All proxies started')),
  (err) => console.error(chalk.red(`Failed to start proxies (${err})`))
);

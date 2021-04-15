import raven from 'raven';
import nodeUtil from 'util';

import createApp from './app';
import config from './config';
import logger, { setLogFormat } from './logger';

if (process.env.NODE_ENV === 'development') {
  require('source-map-support').install();
  setLogFormat('bunyan');
}

console.log = (...args): void => {
  logger.info(nodeUtil.format('', ...args));
};

console.error = (...args): void => {
  logger.error(nodeUtil.format('', ...args));
};

console.warn = (...args): void => {
  logger.warn(nodeUtil.format('', ...args));
};

if (config.sentry) {
  raven.config(config.sentry.dsn).install();
}

createApp().start();

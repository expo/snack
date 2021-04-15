import bunyanMiddleware from 'bunyan-middleware';
import cors from 'cors';
import express, { Express } from 'express';
import path from 'path';

import bundle from './bundle';
import config from './config';
import git from './git';
import logger from './logger';

export type SnackagerExpressApp = Express & {
  /* Start the express app, listeing to the configured port */
  start: () => void;
};

export default function createApp(): SnackagerExpressApp {
  const app = express() as SnackagerExpressApp;

  app.use(
    bunyanMiddleware({
      filter: (req) => req.url === '/status',
      logger,
    })
  );
  app.use(cors());

  app.get('/bundle/*', bundle);

  app.get('/git', git);

  app.get('/status', (_req, res) => {
    // TODO check disk space, config values, etc
    res.send('OK');
  });

  app.get('/version', (_req, res) => {
    res.status(200);
    res.end(
      JSON.stringify({
        version: process.env.APP_VERSION ?? 'development',
        timestamp: process.env.BUILD_TIMESTAMP ?? '',
      })
    );
  });

  if (process.env.DEBUG_LOCAL_FILES) {
    app.use('/serve', express.static(path.join(config.tmpdir, 'output')));
  }

  app.start = () => {
    app.listen(config.port, () => logger.info({ port: config.port }, `ready`));
  };

  return app;
}

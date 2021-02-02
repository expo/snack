import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import compress from 'koa-compress';
import mount from 'koa-mount';
import serve from 'koa-static';
import { AddressInfo } from 'net';
import nullthrows from 'nullthrows';
import path from 'path';
import Raven from 'raven';
import stoppable from 'stoppable';

import routes from './routes';
import sw from './sw';
import createLogger from './utils/createLogger';

type ShutdownSignal = 'SIGHUP' | 'SIGINT' | 'SIGTERM' | 'SIGUSR2';

const port = 3011;
const host = '::';
const backlog = 511;
const timeout = 30000;
const logger = createLogger({ name: 'snack' });

if (require.main === module) {
  if (process.env.NODE_ENV === 'development') {
    require('source-map-support').install();
  }

  if (process.env.NODE_ENV === 'production' || process.env.SNACK_SENTRY_DSN) {
    Raven.config(nullthrows(process.env.SNACK_SENTRY_DSN), {
      release:
        process.env.NODE_ENV === 'production' ? nullthrows(process.env.APP_VERSION) : undefined,
      captureUnhandledRejections: true,
      shouldSendCallback() {
        return process.env.NODE_ENV === 'production';
      },
    }).install();
  }
}

const app = new Koa();

app.on('error', (err, ctx: Koa.Context) => {
  // We get EPIPE and ECONNRESET errors if the client terminates the connection. Log these but
  // don't report them as errors.
  const isConnectionError =
    (err.code === 'EPIPE' && err.syscall === 'write') || err.code === 'ECONNRESET';

  // Log error with context
  const log = {
    err,
    ctx,
    req: ctx.request,
  };
  if (isConnectionError) {
    logger.warn(log);
  } else {
    logger.error(log);
  }
});

if (process.env.COMPRESS_ASSETS === 'true') {
  // Enable gzip compression conditionally, for development
  // This makes it easier to test how big bundles will be in production
  app.use(compress());
}

app.use(sw());

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
  app.use(mount('/dist', serve(path.join(__dirname, '..', '..', 'dist'))));
} else {
  // Use webpack dev middleware in development
  const webpack = require('webpack');
  const dev = require('webpack-dev-middleware');
  const config = require('../../webpack.config');

  const compiler = webpack(config);
  const middleware = dev(compiler, {
    publicPath: '/dist/',
    stats: 'minimal',
  });

  app.use(async (ctx, next) => {
    await middleware(
      ctx.req,
      {
        end: (content: string) => {
          ctx.body = content;
        },
        setHeader: (name: string, value: string) => {
          ctx.set(name, value);
        },
      },
      next
    );
  });
}

app.use(bodyParser());
app.use(routes());

const httpServer = app.listen(port, host, backlog, () => {
  const { address, port } = server.address() as AddressInfo;

  console.log(
    `The Snack web server is listening on http://${address}:${port} using NODE_ENV=${process.env.NODE_ENV}`
  );
});

httpServer.timeout = timeout;

// In development, it's common to stop or restart the server so we immediately end and close all
// sockets when stopping the server instead of waiting for the requests to finish. In production,
// we allow the requests a grace period to complete before ending and closing the sockets.
const gracePeriod = process.env.NODE_ENV === 'development' ? 0 : httpServer.timeout;
const server = stoppable(httpServer, gracePeriod);

// Listen to HTTP server error events and handle shutting down the server gracefully
let exitSignal: ShutdownSignal | null = null;
let httpServerError: Error | null = null;

server.on('error', (error) => {
  httpServerError = error;
  console.error(`There was an error with the HTTP server:`, error);
  console.error(`The HTTP server is shutting down and draining existing connections`);
  server.stop();
});

server.on('close', () => {
  console.log(`The HTTP server has drained all connections and is scheduling its exit`);
  console.log(`The HTTP server process is exiting...`);
  // Let other "close" event handlers run before exiting
  process.nextTick(() => {
    if (exitSignal) {
      process.kill(process.pid, exitSignal);
    } else {
      process.exit(httpServerError ? 1 : 0);
    }
  });
});

const shutdown = (signal: ShutdownSignal) => {
  console.log(
    `Received ${signal}; the HTTP server is shutting down and draining existing connections`
  );
  exitSignal = signal;
  server.stop();
};

// TODO: In Node 9, the signal is passed as the first argument to the listener
process.once('SIGHUP', () => shutdown('SIGHUP'));
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
// Nodemon sends SIGUSR2 when it restarts the process it's monitoring
process.once('SIGUSR2', () => shutdown('SIGUSR2'));

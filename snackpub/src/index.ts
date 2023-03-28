import assert from 'assert';
import http from 'http';
import { createClient } from 'redis';
import { Server, Socket } from 'socket.io';

import Env from './Env';
import {
  createHttpEndpointsListener,
  type RequestHandler,
  LivenessRequestHandler,
  ReadinessRequestHandler,
  ReadOnlyRequestsHandler,
} from './HttpEndpoints';
import { getRemoteAddress } from './NetworkUtils';
import RateLimiter from './RateLimiter';
import { bindRedisAdapterAsync } from './RedisAdapter';
import TypedEventEmitter from './TypedEventEmitter';
import type {
  ClientToServerEvents,
  InterServerEvents,
  NullableRedisClientType,
  ServerToClientEvents,
  SocketData,
} from './types';

const debug = require('debug')('snackpub');

const REDIS_RECONNECT_MAX_RETRIES = 60;
const REDIS_RECONNECT_RETRY_DELAY_MS = 1000;

const eventEmitter = new TypedEventEmitter<{
  redisServerUnreachable: () => void;
}>();

async function runAsync() {
  if (Env.nodeEnv === 'production') {
    assert(Env.redisURL, `Redis must be configured`);
  }

  const httpRequestHandlers: RequestHandler[] = [];
  const httpServer = http.createServer(createHttpEndpointsListener(httpRequestHandlers));
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      serveClient: false,
    }
  );

  let redisClient: NullableRedisClientType = null;
  let redisSubscriptionClient: NullableRedisClientType = null;
  let rateLimiter: RateLimiter | null = null;
  if (Env.redisURL) {
    const redisClientOptions: Parameters<typeof createClient>[0] = {
      url: Env.redisURL,
      socket: {
        reconnectStrategy: (retries: number) => {
          if (retries >= REDIS_RECONNECT_MAX_RETRIES) {
            eventEmitter.emit('redisServerUnreachable');
            return false;
          }
          return REDIS_RECONNECT_RETRY_DELAY_MS;
        },
      },
    };

    redisClient = createClient(redisClientOptions);
    await redisClient.connect();

    redisSubscriptionClient = await bindRedisAdapterAsync(io, redisClient);
    rateLimiter = new RateLimiter(redisClient);
  }

  httpRequestHandlers.push(new ReadOnlyRequestsHandler());
  httpRequestHandlers.push(new LivenessRequestHandler());
  httpRequestHandlers.push(new ReadinessRequestHandler([redisClient, redisSubscriptionClient]));

  io.on('connection', async (socket) => {
    const remoteAddress = getRemoteAddress(socket.request) ?? 'UNKNOWN';
    console.log(`New connection from ${remoteAddress}`);

    if (await rateLimiter?.hasExceededRemoteAddressRateAsync(remoteAddress, socket.id)) {
      terminateSocket(socket, 'Too many requests.');
    }

    socket.on('message', async (data) => {
      if (await rateLimiter?.hasExceededMessagesRateAsync(remoteAddress, socket.id)) {
        terminateSocket(socket, 'Too many messages.');
      }

      const { channel, message, sender } = data;
      socket.to(channel).emit('message', { channel, message, sender });
    });

    socket.on('subscribeChannel', async (data) => {
      debug('onSubscribeChannel', data);
      if (await rateLimiter?.hasExceededChannelsRateAsync(remoteAddress, socket.id)) {
        terminateSocket(socket, 'Too many channels.');
      }

      const { channel, sender } = data;
      socket.join(channel);
      socket.data.deviceId = sender;
      debug('joinChannel', { channel, sender });
      socket.to(channel).emit('joinChannel', { channel, sender });
    });

    socket.on('unsubscribeChannel', (data) => {
      debug('onUnsubscribeChannel', data);
      const { channel, sender } = data;
      socket.leave(channel);
      debug('leaveChannel', { channel, sender });
      socket.to(channel).emit('leaveChannel', { channel, sender });
    });

    socket.on('disconnecting', () => {
      const sender = socket.data.deviceId;
      if (!sender) {
        // No-op if the disconnecting socket doesn't bind with a device ID
        return;
      }
      for (const channel of socket.rooms) {
        if (channel === socket.id) {
          // socket.io implicitly creates a default channel for each socket. The default channel's name is the socket's ID.
          // We should skip the default channel when broadcasting the leaveChannel event.
          continue;
        }
        debug('leaveChannel', { channel, sender });
        socket.to(channel).emit('leaveChannel', { channel, sender });
      }
    });
  });

  const redisClients = [redisClient, redisSubscriptionClient];
  registerRedisClientErrorHandlers(redisClients);
  registerShutdownHandlers(io, redisClients);
  eventEmitter.once('redisServerUnreachable', () => {
    shutdownAsync(io, redisClients);
  });
  httpServer.listen(Env.port);
}

(async () => {
  try {
    await runAsync();
  } catch (e) {
    console.error('Uncaught Error', e);
    process.exit(1);
  }
})();

/**
 * Register process signals to shutdown the server
 */
function registerShutdownHandlers(server: Server, redisClients: NullableRedisClientType[]) {
  const shutdownSignals: NodeJS.Signals[] = [
    'SIGHUP',
    'SIGINT',
    'SIGTERM',
    'SIGUSR2', // Nodemon sends SIGUSR2 when it restarts the process it's monitoring
  ];

  for (const signal of shutdownSignals) {
    process.once(signal, (signal: NodeJS.Signals) => {
      console.log(
        `Received ${signal}; the HTTP server is shutting down and draining existing connections`
      );
      shutdownAsync(server, redisClients);
    });
  }
}

/**
 * Register Redis client handlers
 */
function registerRedisClientErrorHandlers(redisClients: NullableRedisClientType[]) {
  for (const redisClient of redisClients) {
    redisClient?.on('error', (error) => {
      // node-redis emits errors even when reconnecting,
      // leave this error handler as no-op and handle in `reconnectStrategy`.
      debug('Redis client error', error);
    });
    redisClient?.on('reconnecting', () => {
      debug(
        `Reconnecting to Redis server in ${REDIS_RECONNECT_RETRY_DELAY_MS}ms - redisURL[${Env.redisURL}]`
      );
    });
  }
}

/**
 * Gracefully shutdown the Snackpub server
 */
async function shutdownAsync(server: Server, redisClients: NullableRedisClientType[]) {
  await closeServerAsync(server);
  await Promise.all(redisClients.map((redisClient) => redisClient?.quit()));
}

/**
 * Server.close() as async function
 */
function closeServerAsync(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close((error) => {
      if (error) {
        console.error('Failed to close server', error);
      }
      resolve();
    });
  });
}

/**
 * Force terminate a socket.io client
 */
function terminateSocket(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  reason: string
) {
  let timeoutHandler: NodeJS.Timeout | null = null;
  socket.once('disconnect', () => {
    if (timeoutHandler != null) {
      clearTimeout(timeoutHandler);
      timeoutHandler = null;
    }
  });

  socket.emit('terminate', reason);

  // When clients receive the `terminate` message, they should disconnect and no longer try to reconnect back to the server.
  // In case the clients do not handle the `terminate` message, e.g. from other websocket clients other than snackpub clients.
  // We will wait three seconds to close the connections actively.
  timeoutHandler = setTimeout(() => {
    if (socket.connected) {
      socket.disconnect(true);
    }
  }, 3000);
}

import assert from 'assert';
import { createClient } from 'redis';
import { Server, Socket } from 'socket.io';

import Env from './Env';
import RateLimiter from './RateLimiter';
import { bindRedisAdapterAsync } from './RedisAdapter';
import TypedEventEmitter from './TypedEventEmitter';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from './types';

const debug = require('debug')('snackpub');

type RedisClientType = ReturnType<typeof createClient>;
type NullableRedisClientType = RedisClientType | null;

const REDIS_RECONNECT_MAX_RETRIES = 60;
const REDIS_RECONNECT_RETRY_DELAY_MS = 1000;

const eventEmitter = new TypedEventEmitter<{
  redisServerUnreachable: () => void;
}>();

async function runAsync() {
  if (Env.nodeEnv === 'production') {
    assert(Env.redisURL, `Redis must be configured`);
  }

  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>({
    serveClient: false,
  });

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

  io.on('connection', async (socket) => {
    debug('onconnect', socket.handshake.address);
    if (await rateLimiter?.hasExceededSrcIpRateAsync(socket.handshake.address, socket.id)) {
      terminateSocket(socket, 'Too many requests.');
    }

    socket.on('message', async (data) => {
      if (await rateLimiter?.hasExceededMessagesRateAsync(socket.handshake.address, socket.id)) {
        terminateSocket(socket, 'Too many messages.');
      }

      const { channel, message, sender } = data;
      socket.to(channel).emit('message', { channel, message, sender });
    });

    socket.on('subscribeChannel', async (data) => {
      debug('onSubscribeChannel', data);
      if (await rateLimiter?.hasExceededChannelsRateAsync(socket.handshake.address, socket.id)) {
        terminateSocket(socket, 'Too many channels.');
      }

      const { channel, sender } = data;
      socket.join(channel);
      socket.data.deviceId = sender;
    });

    socket.on('unsubscribeChannel', (data) => {
      debug('onUnsubscribeChannel', data);
      const { channel } = data;
      socket.leave(channel);
    });
  });

  io.of('/').adapter.on('join-room', async (channel: string, id: string) => {
    const sockets = await io.in(channel).fetchSockets();
    const sender = sockets.filter((socket) => socket.id === id)[0]?.data.deviceId;
    if (!sender) {
      return;
    }
    for (const socket of sockets) {
      if (socket.id !== id) {
        debug('joinChannel', { channel, sender });
        socket.emit('joinChannel', { channel, sender });
      }
    }
  });

  io.of('/').adapter.on('leave-room', async (channel: string, id: string) => {
    const sockets = await io.in(channel).fetchSockets();
    const sender = sockets.filter((socket) => socket.id === id)[0]?.data.deviceId;
    if (!sender) {
      return;
    }
    for (const socket of sockets) {
      if (socket.id !== id) {
        debug('leaveChannel', { channel, sender });
        socket.emit('leaveChannel', { channel, sender });
      }
    }
  });

  const redisClients = [redisClient, redisSubscriptionClient];
  registerRedisClientErrorHandlers(redisClients);
  registerShutdownHandlers(io, redisClients);
  eventEmitter.once('redisServerUnreachable', () => {
    shutdownAsync(io, redisClients);
  });
  io.listen(Env.port);
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
      debug(`Reconnecting Redis server in ${REDIS_RECONNECT_RETRY_DELAY_MS}ms`);
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

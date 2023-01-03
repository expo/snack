import { Server } from 'socket.io';

import Env from './Env';
import { maybeBindRedisAdapterAsync, maybeCloseRedisConnectionsAsync } from './RedisAdapter';
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  ShutdownSignal,
  SocketData,
} from './types';

const debug = require('debug')('snackpub');

function registerShutdownHandlers(server: Server) {
  const shutdown = async (signal: ShutdownSignal) => {
    console.log(
      `Received ${signal}; the HTTP server is shutting down and draining existing connections`
    );
    await closeServerAsync(server);
    await maybeCloseRedisConnectionsAsync();
  };

  // TODO: In Node 9, the signal is passed as the first argument to the listener
  process.once('SIGHUP', () => shutdown('SIGHUP'));
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  // Nodemon sends SIGUSR2 when it restarts the process it's monitoring
  process.once('SIGUSR2', () => shutdown('SIGUSR2'));
}

function closeServerAsync(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close((error) => {
      if (error) {
        console.log('Failed to close server', error);
      }
      resolve();
    });
  });
}

async function runAsync() {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>({
    serveClient: false,
  });

  await maybeBindRedisAdapterAsync(io);

  io.on('connection', (socket) => {
    debug('onconnect', socket.handshake.address);
    socket.on('message', (data) => {
      // debug('onMessage', data);
      const { channel, message, sender } = data;
      socket.to(channel).emit('message', { channel, message, sender });
    });

    socket.on('subscribeChannel', (data) => {
      debug('onSubscribeChannel', data);
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
    const sender = sockets.filter((socket) => socket.id === id)?.[0]?.data?.deviceId;
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
    const sender = sockets.filter((socket) => socket.id === id)?.[0]?.data?.deviceId;
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

  registerShutdownHandlers(io);
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

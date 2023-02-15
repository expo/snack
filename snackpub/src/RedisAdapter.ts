import { createAdapter } from '@socket.io/redis-adapter';
import fs from 'fs';
import { createClient } from 'redis';
import type { Server } from 'socket.io';

import Env from './Env';

let pubClient: ReturnType<typeof createClient> | null = null;
let subClient: ReturnType<typeof createClient> | null = null;

export async function maybeBindRedisAdapterAsync(
  server: Server,
  inputOptions: Parameters<typeof createClient>[0] = {}
) {
  if (Env.redisURL) {
    const options: Parameters<typeof createClient>[0] = {
      url: Env.redisURL,
    };
    pubClient = createClient({ ...options, ...inputOptions });
    subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    server.adapter(createAdapter(pubClient, subClient, { key: 'snackpub' }));
    console.log('[RedisAdapter] Using redis adapter.');
  }
}

export async function maybeCloseRedisConnectionsAsync() {
  subClient?.quit();
  subClient = null;

  pubClient?.quit();
  pubClient = null;
}

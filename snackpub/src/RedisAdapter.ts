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
    try {
      const options: Parameters<typeof createClient>[0] = {
        url: Env.redisURL,
      };
      if (Env.redisURL.startsWith('rediss:') && Env.redisTlsCa) {
        options.socket = {
          tls: true,
          ca: fs.readFileSync(Env.redisTlsCa),
        };
      }

      pubClient = createClient({ ...options, ...inputOptions });
      subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);
      server.adapter(createAdapter(pubClient, subClient, { key: 'snackpub' }));
      console.log('[RedisAdapter] Using redis adapter.');
    } catch (e: any) {
      console.error('Failed to bind redis adapter', e);
    }
  }
}

export async function maybeCloseRedisConnectionsAsync() {
  subClient?.quit();
  subClient = null;

  pubClient?.quit();
  pubClient = null;
}

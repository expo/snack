import { createAdapter } from '@socket.io/redis-adapter';
import type { createClient } from 'redis';
import type { Server } from 'socket.io';

let subClient: ReturnType<typeof createClient> | null = null;

export async function bindRedisAdapterAsync(
  server: Server,
  redisClient: ReturnType<typeof createClient>
) {
  subClient = redisClient.duplicate();
  await subClient.connect();
  server.adapter(createAdapter(redisClient, subClient, { key: 'snackpub' }));
  console.log('[RedisAdapter] Using redis adapter.');
}

export async function closeRedisAdapterAsync() {
  subClient?.quit();
  subClient = null;
}

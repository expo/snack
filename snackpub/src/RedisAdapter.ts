import { createAdapter } from '@socket.io/redis-adapter';
import type { createClient } from 'redis';
import type { Server } from 'socket.io';

export async function bindRedisAdapterAsync(
  server: Server,
  redisClient: ReturnType<typeof createClient>
): Promise<ReturnType<typeof createClient>> {
  const redisSubscriptionClient = redisClient.duplicate();
  await redisSubscriptionClient.connect();
  server.adapter(createAdapter(redisClient, redisSubscriptionClient, { key: 'snackpub' }));
  console.log('[RedisAdapter] Using redis adapter.');
  return redisSubscriptionClient;
}

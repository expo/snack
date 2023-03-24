import { createAdapter } from '@socket.io/redis-adapter';
import type { Server } from 'socket.io';

import { type RedisClientType } from './types';

export async function bindRedisAdapterAsync(
  server: Server,
  redisClient: RedisClientType
): Promise<RedisClientType> {
  const redisSubscriptionClient = redisClient.duplicate();
  await redisSubscriptionClient.connect();
  server.adapter(createAdapter(redisClient, redisSubscriptionClient, { key: 'snackpub' }));
  console.log('[RedisAdapter] Using redis adapter.');
  return redisSubscriptionClient;
}

import redis from 'redis';

import config from '../config';

export { RedisClient } from 'redis';

export function createRedisClient(options: redis.ClientOpts = {}): redis.RedisClient {
  return redis.createClient(config.redis.url, options);
}

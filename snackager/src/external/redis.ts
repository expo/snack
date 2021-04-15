import fs from 'fs';
import redis from 'redis';

import config from '../config';

export { RedisClient } from 'redis';

export function createRedisClient(options: redis.ClientOpts = {}): redis.RedisClient {
  if (config.redis.url.startsWith('rediss:')) {
    options.tls = { ca: fs.readFileSync(config.redis.tls_ca) };
  }
  return redis.createClient(config.redis.url, options);
}

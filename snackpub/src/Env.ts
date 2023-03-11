export default {
  port: parseInt(process.env.PORT ?? '3013', 10),
  redisURL: process.env.REDIS_URL,
  nodeEnv: process.env.NODE_ENV as 'production' | 'development' | undefined,
};

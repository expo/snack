export default {
  port: parseInt(process.env.PORT ?? '3013', 10),
  redisURL: process.env.REDIS_URL,
};

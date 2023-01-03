export default {
  port: parseInt(process.env.PORT ?? '3013', 10),
  redisURL: process.env.REDIS_URL,
  redisTlsCa: process.env.REDIS_TLS_CA,
};

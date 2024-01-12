export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      cloudEnv: process.env.CLOUD_ENV,
    },
  };
};

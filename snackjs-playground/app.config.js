export default ({ config }) => {
  return {
    ...config,
    extra: {
      cloudEnv: process.env.CLOUD_ENV,
    },
  };
};

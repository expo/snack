const fs = require('fs');
const path = require('path');
const { GetEnvVars } = require('env-cmd');

module.exports = (async function () {
  const processArgs = process.argv.join(' ');
  const baseEnv = await GetEnvVars({ envFile: { filePath: './k8s/base/snackager.env' } });
  const baseSecrets = {
    SENTRY_DSN: fs.readFileSync('./k8s/base/secrets/SENTRY_DSN').toString(),
    REDIS_URL: 'redis://localhost:6379/0', // proxied by port-forward-redis
  };
  const stagingEnv = await GetEnvVars({ envFile: { filePath: './k8s/staging/snackager.env' } });
  const stagingSecrets = await GetEnvVars({
    envFile: { filePath: './k8s/staging/secrets/snackager.env' },
  });

  delete stagingSecrets['REDIS_URL']; // this is set above for the proxy

  if (!stagingSecrets.GIT_SESSION_SECRET && !processArgs.includes('env-cmd -e test')) {
    console.error(
      'Secrets are locked, unable to start Snackager. External contributors cannot start Snackager and can ignore this error. snack-proxies will redirect traffic to the Snackager service running on the staging environment.\n'
    );
    throw new Error('Secrets are locked.');
  }
  return {
    development: {
      NODE_ENV: 'development',
      ...baseEnv,
      ...baseSecrets,
      ...stagingEnv,
      ...stagingSecrets,
    },
    test: {
      NODE_ENV: 'test',
    },
    production: {
      NODE_ENV: 'production',
    },
  };
})();

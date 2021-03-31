const fs = require('fs');
const path = require('path');
const { GetEnvVars } = require('env-cmd');

module.exports = (async function () {
  const processArgs = process.argv.join(' ');
  const baseEnv = await GetEnvVars({ envFile: { filePath: './k8s/base/snackager.env' } });
  const baseSecrets = {
    SENTRY_DSN: fs.readFileSync('./k8s/base/secrets/SENTRY_DSN').toString(),
    REDIS_TLS_CA: path.join(__dirname, './k8s/base/redislabs_ca.pem'),
  };
  const stagingEnv = await GetEnvVars({ envFile: { filePath: './k8s/staging/snackager.env' } });
  const stagingSecrets = await GetEnvVars({
    envFile: { filePath: './k8s/staging/secrets/snackager.env' },
  });
  if (!stagingSecrets.REDIS_URL && !processArgs.includes('env-cmd -e test')) {
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

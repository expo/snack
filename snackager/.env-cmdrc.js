const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { GetEnvVars } = require('env-cmd');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager').v1;

async function getSecretEnv(name) {
  const secretmanagerClient = new SecretManagerServiceClient();
  try {
    const response = await secretmanagerClient.accessSecretVersion({ name });
    return JSON.parse(response[0].payload.data.toString());
  } catch {
    return {};
  }
}

module.exports = (async function () {
  const processArgs = process.argv.join(' ');
  const baseEnv = await GetEnvVars({ envFile: { filePath: './k8s/base/snackager.env' } });
  const stagingEnv = await GetEnvVars({ envFile: { filePath: './k8s/staging/snackager.env' } });
  const baseSecrets = {
    REDIS_URL: 'redis://localhost:6379/0', // proxied by port-forward-redis
  };
  const externalSecret = yaml.load(fs.readFileSync(
    './k8s/staging/external-secret-env.yaml',
    'utf8',
  ));
  const secretName = externalSecret.spec.dataFrom[0].extract.key;
  const secretVersion = externalSecret.spec.dataFrom[0].extract.version;
  const secretResourceName = `projects/77257980902/secrets/${secretName}/versions/${secretVersion}`;
  const stagingSecrets = await getSecretEnv(secretResourceName);
  delete stagingSecrets['REDIS_URL']; // this is set above for the proxy

  if (!stagingSecrets.GIT_SESSION_SECRET && !processArgs.includes('env-cmd -e test')) {
    console.error(
      'Cannot access secrets, unable to start Snackager. External contributors cannot start Snackager and can ignore this error. snack-proxies will redirect traffic to the Snackager service running on the staging environment.\n'
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
      NODE_OPTIONS: '--openssl-legacy-provider',
    },
    production: {
      NODE_ENV: 'production',
    },
  };
})();

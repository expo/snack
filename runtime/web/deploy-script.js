const spawnAsync = require('@expo/spawn-async');
const expoVersion = require('expo/package.json').version;
const path = require('path');
const semver = require('semver');

/* eslint-env node */
run();

/** Export, patch, and upload Snack Runtime web */
async function run() {
  const workingDir = path.resolve(__dirname, '../');
  const exportDir = './web-build';

  await exportWeb({ workingDir, exportDir });
  // await uploadWeb({ workingDir, exportDir });
}

/**
 * Export the Snack Runtime to deploy to S3.
 *
 * @param {object} options
 * @param {string} options.workingDir
 * @param {string} options.exportDir
 */
async function exportWeb(options) {
  await spawnAsync(
    'yarn',
    ['expo', 'export', '--platform=web', `--output-dir=${options.exportDir}`],
    {
      cwd: options.workingDir,
      stdio: process.env.CI ? 'inherit' : 'ignore',
    },
  );
  console.log(
    `✅ Exported the Snack Runtime to: ${path.join(options.workingDir, options.exportDir)}`,
  );
}

/**
 * Upload the exported web bundle to S3.
 *
 * @param {object} options
 * @param {string} options.workingDir
 * @param {string} options.exportDir
 */
async function uploadWeb(options) {
  const sdkVersion = semver.major(expoVersion);
  const bucketName =
    process.env.EXPO_PUBLIC_SNACK_ENV === 'production'
      ? 'snack-web-player'
      : 'snack-web-player-staging';

  await spawnAsync(
    'yarn',
    [
      's3-deploy',
      './web-build/**',
      `--cwd=${options.exportDir}`,
      '--region=us-west-1',
      `--bucket=${bucketName}`,
      `--filePrefix=v2/${sdkVersion}`,
    ],
    {
      cwd: options.workingDir,
      stdio: process.env.CI ? 'inherit' : 'ignore',
    },
  );

  console.log(`✅ Uploaded the Snack Runtime to S3: ${bucketName} (/v2/${sdkVersion})`);
}

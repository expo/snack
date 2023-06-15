const spawnAsync = require('@expo/spawn-async');
const expoVersion = require('expo/package.json').version;
const fs = require('fs/promises');
const path = require('path');
const semver = require('semver');

/* eslint-env node */
run();

/** Export, patch, and upload Snack Runtime web */
async function run() {
  const exportDir = path.resolve(__dirname, '../web-build');

  await exportWeb(exportDir);
  await patchBundleImportPath(exportDir);
  await uploadWeb(exportDir);
}

/**
 * Export the Snack Runtime to deploy to S3.
 *
 * @param {string} exportDir
 */
async function exportWeb(exportDir) {
  await spawnAsync('yarn', ['expo', 'export', `--output-dir="${exportDir}"`, '--platform=web'], {
    cwd: path.resolve(__dirname, '../'),
    stdio: process.env.CI ? 'inherit' : 'ignore',
  });
  console.log(`✅ Exported the Snack Runtime to: ${exportDir}`);
}

/**
 * Fix the bundle path import in the `dist/index.html` export.
 * This is required because the Snack Runtime is hosted in S3 under subfolders.
 * We need to convert `<script src="/bundles/web-...">` to `<script src="bundles/web-...">`.
 *
 * @param {string} exportDir
 */
async function patchBundleImportPath(exportDir) {
  const indexPath = path.resolve(exportDir, './index.html');
  const indexFile = await fs.readFile(indexPath, 'utf8');
  const patchedFile = indexFile.replace(`<script src="/bundles/web-`, `<script src="bundles/web-`);

  if (patchedFile === indexFile) {
    throw new Error('Could not patch the bundle import path in the index.html file');
  }

  await fs.writeFile(indexPath, patchedFile, 'utf8');
  console.log('✅ Patched bundle import path for S3');
}

/**
 * Upload the exported web bundle to S3.
 *
 * @param {string} exportDir
 */
async function uploadWeb(exportDir) {
  const sdkVersion = semver.major(expoVersion);
  const bucketName =
    process.env.NODE_ENV === 'production' ? 'snack-web-player' : 'snack-web-player-staging';

  await spawnAsync(
    'yarn',
    [
      's3-deploy',
      './web-build/**',
      `--cwd="${exportDir}"`,
      '--region=us-west-1',
      `--bucket=${bucketName}`,
      `--filePrefix="v2/${sdkVersion}"`,
    ],
    {
      cwd: path.resolve(__dirname, '../'),
      stdio: process.env.CI ? 'inherit' : 'ignore',
    }
  );

  console.log(`✅ Uploaded the Snack Runtime to S3: ${bucketName} (v2/${sdkVersion})`);
}

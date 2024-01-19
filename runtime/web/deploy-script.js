const spawnAsync = require('@expo/spawn-async');
const expoVersion = require('expo/package.json').version;
const fs = require('fs/promises');
const path = require('path');
const semver = require('semver');

/* eslint-env node */
run();

/** Export, patch, and upload Snack Runtime web */
async function run() {
  const workingDir = path.resolve(__dirname, '../');
  const exportDir = './web-build';

  await exportWeb({ workingDir, exportDir });
  await patchBundleImportPath({ workingDir, exportDir });
  await patchFaviconImportPath({ workingDir, exportDir });
  await uploadWeb({ workingDir, exportDir });
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
      env: {
        ...process.env,
        SNACK_EXPORT_WEB: 'true',
      },
    },
  );
  console.log(
    `✅ Exported the Snack Runtime to: ${path.join(options.workingDir, options.exportDir)}`,
  );
}

/**
 * Fix the bundle path import in the `dist/index.html` export.
 * This is required because the Snack Runtime is hosted in S3 under subfolders.
 * We need to convert `<script src="/_expo/static...">` to `<script src="_expo/static...">`.
 *
 * @param {object} options
 * @param {string} options.workingDir
 * @param {string} options.exportDir
 */
async function patchBundleImportPath(options) {
  const indexPath = path.resolve(options.workingDir, options.exportDir, './index.html');
  const indexFile = await fs.readFile(indexPath, 'utf8');
  const patchedFile = indexFile.replace(`<script src="/_expo`, `<script src="_expo`);

  if (patchedFile === indexFile) {
    throw new Error('Could not patch the bundle import path in the index.html file');
  }

  await fs.writeFile(indexPath, patchedFile, 'utf8');
  console.log(`✅ Patched bundle import path in: ${indexPath}`);
}

/**
 * Fix the favicon import in the `dist/index.html` export.
 * This is required because the Snack Runtime is hosted in S3 under subfolders.
 * We need to convert `<link rel="shortcut icon" href="/favicon.ico" />` to `<link rel="shortcut icon" href="favicon.ico" />`.
 *
 * @param {object} options
 * @param {string} options.workingDir
 * @param {string} options.exportDir
 */
async function patchFaviconImportPath(options) {
  const indexPath = path.resolve(options.workingDir, options.exportDir, './index.html');
  const indexFile = await fs.readFile(indexPath, 'utf8');
  const patchedFile = indexFile.replace(`href="/favicon.ico"`, `href="favicon.ico"`);

  if (patchedFile === indexFile) {
    throw new Error('Could not patch the favicon path in the index.html file');
  }

  await fs.writeFile(indexPath, patchedFile, 'utf8');
  console.log(`✅ Patched favicon path in: ${indexPath}`);
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

  console.log(`✅ Uploaded the Snack Runtime to S3: ${bucketName} (v2/${sdkVersion})`);
}

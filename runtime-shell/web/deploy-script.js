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
  await patchAssetPath({ workingDir, exportDir });
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
 * We need to convert `<script src="/bundles/web-...">` to `<script src="bundles/web-...">`.
 *
 * @param {object} options
 * @param {string} options.workingDir
 * @param {string} options.exportDir
 */
async function patchBundleImportPath(options) {
  const indexPath = path.resolve(options.workingDir, options.exportDir, './index.html');
  const indexFile = await fs.readFile(indexPath, 'utf8');
  const patchedFile = indexFile.replace(`<script src="/bundles/web-`, `<script src="bundles/web-`);

  if (patchedFile === indexFile) {
    throw new Error('Could not patch the bundle import path in the index.html file');
  }

  await fs.writeFile(indexPath, patchedFile, 'utf8');
  console.log(`✅ Patched bundle import path in: ${indexPath}`);
}

/**
 * Fix the asset export paths in the `dist/...` export.
 * This is required because we use the `transformer.publicPath`, in the Metro config,
 * to host the Snack Runtime on an S3 bucket subfolder.
 *
 * @param {object} options
 * @param {string} options.workingDir
 * @param {string} options.exportDir
 */
async function patchAssetPath(options) {
  const exportPath = path.resolve(options.workingDir, options.exportDir);
  const publicFolder = path.resolve(exportPath, 'v2', String(semver.major(expoVersion)), 'assets');
  const assetFolder = path.resolve(exportPath, 'assets');

  const filesOrFolders = await fs.readdir(publicFolder);

  for (const fileOrFolder of filesOrFolders) {
    const fileOrFolderPath = path.resolve(publicFolder, fileOrFolder);
    const assetPath = path.resolve(assetFolder, fileOrFolder);

    await fs.rename(fileOrFolderPath, assetPath);

    const relativeFilesOrFolderPath = path.relative(options.workingDir, fileOrFolderPath);
    const relativeAssetPath = path.relative(options.workingDir, assetPath);

    console.log(`✅ Moved public asset: "${relativeFilesOrFolderPath}" → "${relativeAssetPath}"`);
  }

  // Clean up folders without force-deleting it, if anything is left, it should fail on this part.
  await fs.rm(path.resolve(exportPath, 'v2', String(semver.major(expoVersion)), 'assets'), {
    recursive: true,
  });
  await fs.rm(path.resolve(exportPath, 'v2', String(semver.major(expoVersion))), {
    recursive: true,
  });
  await fs.rm(path.resolve(exportPath, 'v2'), { recursive: true });

  console.log(`✅ Moved ${filesOrFolders.length} public assets`);
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
    process.env.NODE_ENV === 'production' ? 'snack-web-player' : 'snack-web-player-staging';

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

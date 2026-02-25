import fetch from 'node-fetch';
import path from 'path';
import raven from 'raven';

import addS3Redirect from './addS3Redirect';
import fetchAndExtract from './fetchAndExtract';
import findPath from './findPath';
import installPackage from './installPackage';
import packageBundle from './packageBundle';
import uploadFile from './uploadFile';
import getCachePrefix from '../cache-busting';
import config from '../config';
import { UnbundleablePackageError } from '../errors';
import { createRedisClient } from '../external/redis';
import logger from '../logger';
import { Package } from '../types';

// TODO: find the typescript definitions for this package, `@types/sander` doesn't exists
const { mkdir, rimraf, writeFile, exists } = require('sander');

type Options = {
  pkg: Package;
  version: string;
  deep?: string | null;
  platforms: string[];
  rebuild: boolean;
  dependencies: { [key: string]: string | null };
  hash: string;
  latestHash?: string | null;
  versionSnackager: boolean;
  sdkVersion?: string;
};

const EXPIRATION_SECONDS = 60 * 30;
const client = createRedisClient();

type BundlePending = {
  name: string;
  version: string;
  pending: true;
};

type BundleResolved = {
  name: string;
  hash: string;
  handle: string;
  version: string;
  // TODO: fix possible `null` for dependency and replace this with `Package['dependencies']`
  dependencies: { [key: string]: string | null };
};

export type BundleResponse = BundlePending | BundleResolved;

export default async function fetchBundle({
  pkg,
  version,
  deep = null,
  platforms,
  rebuild,
  dependencies, // peerDependencies
  hash,
  latestHash = null,
  versionSnackager,
  sdkVersion,
}: Options): Promise<BundleResponse> {
  const fullName = `${pkg.name}${deep ? `/${deep}` : ''}`;
  const cachePrefix = getCachePrefix(fullName);
  const buildStatusRedisId =
    `snackager/buildStatus/${cachePrefix}/` +
    `${fullName}@${version}-${platforms.join(',')}`.replace(/\//g, '~');
  const latestCompletedVersionRedisId =
    `snackager/latestVersion/${cachePrefix}/` + fullName.replace(/\//g, '~');

  const handle = versionSnackager ? `snackager-${cachePrefix}/${hash}` : hash;
  const latestHandle =
    versionSnackager && latestHash ? `snackager-${cachePrefix}/${latestHash}` : latestHash;

  const logMetadata = { pkg, redisId: buildStatusRedisId };

  const peerDependencies =
    fullName === pkg.name ? dependencies : { ...dependencies, [pkg.name]: version };

  const unavailable: string[] = [];

  // TODO: check if we can simplify this type
  const inProgress: false | null | { [key: string]: string } =
    !rebuild &&
    (await new Promise((resolve) =>
      client.hgetall(buildStatusRedisId, (err, value) => {
        if (err) {
          resolve(null); // TODO(perry) figure out why this is like this and add a comment
        } else {
          resolve(value);
        }
      }),
    ));

  if (inProgress) {
    // The TTL was not always set correctly on the redis value,
    // because it was previously not executed as a transaction.
    // This caused the status to sometimes be permanently "pending" or "error".
    // Delete the corrupted value if the TTL was not set.
    // TODO: Remove this in mid 2021
    client.ttl(buildStatusRedisId, (err, value) => {
      if (!err && value < 0) {
        logger.warn(logMetadata, `redis value without TTL found, deleting`);
        client.del(buildStatusRedisId);
      }
    });

    switch (inProgress.type) {
      case 'pending':
        logger.info(logMetadata, `bundling is already in progress, waiting`);
        return { name: fullName, version, pending: true };
      case 'error':
        logger.warn({ ...logMetadata, error: inProgress.message }, `an error occurred earlier`);
        if (!process.env.DEBUG_LOCAL_FILES) {
          if (inProgress.errorName === 'UnbundleablePackageError') {
            throw new UnbundleablePackageError(inProgress.message);
          }
          throw new Error(inProgress.message);
        }
    }
  }

  await Promise.all(
    platforms.map(async (platform) => {
      if (rebuild) {
        logger.info({ ...logMetadata, platform }, `requested rebuild for platform: ${platform}`);

        unavailable.push(platform);
        return;
      }

      if (process.env.DEBUG_LOCAL_FILES) {
        if (await exists(path.join(config.tmpdir, 'output', `${handle}-${platform}/.done`))) {
          logger.info(
            { ...logMetadata, platform },
            `package is cached locally for platform: ${platform}`,
          );
        } else {
          logger.info(
            { ...logMetadata, platform },
            `is not cached locally for platform: ${platform}`,
          );
          unavailable.push(platform);
        }
      } else {
        const url = `https://s3-${config.s3.region}.amazonaws.com/${
          config.s3.bucket
        }/${encodeURIComponent(handle)}-${platform}/.done`;

        const response = await fetch(url, {
          method: 'HEAD',
          timeout: 10000,
        });
        if (response.status !== 200) {
          logger.info(
            { ...logMetadata, platform, status: response.status },
            `is not cached for platform: ${platform}`,
          );
          unavailable.push(platform);
        }
      }
    }),
  );

  if (!unavailable.length) {
    return {
      name: fullName,
      hash,
      handle,
      version: pkg.version,
      dependencies: peerDependencies,
    };
  }

  logger.info(
    { ...logMetadata, unavailable },
    `package is not cached for ${unavailable.join(', ')}`,
  );

  const dir = `${config.tmpdir}/${buildStatusRedisId}`;
  await mkdir(dir);

  logger.info(logMetadata, `setting key to pending in redis`);
  const isAlreadySet = await new Promise((resolve, reject) => {
    client
      .multi()
      .hsetnx(buildStatusRedisId, 'type', 'pending')
      .expire(buildStatusRedisId, EXPIRATION_SECONDS)
      .exec((err, replies) => {
        if (err) {
          reject(err);
        } else {
          resolve(replies[0] === 0);
        }
      });
  });
  // When the pending status was already set by another instance,
  // then do not attempt to bundle again.
  if (isAlreadySet && !rebuild) {
    logger.info(logMetadata, `bundling is already in progress, waiting`);
    return { name: fullName, version, pending: true };
  }

  try {
    logger.info(logMetadata, `fetching package`);
    await fetchAndExtract(pkg, version, dir);

    const cwd = `${dir}/${findPath(pkg.name, dir)}`;
    logger.info(logMetadata, `installing package at ${cwd}`);
    await installPackage(cwd);

    logger.info(logMetadata, 'packaging bundle');
    const files = await packageBundle({
      pkg,
      cwd,
      deep,
      externalDependencies: peerDependencies,
      base: `${config.cloudfront.url}/${encodeURIComponent(handle)}`,
      platforms: unavailable,
      sdkVersion,
    });

    if (process.env.DEBUG_LOCAL_FILES) {
      logger.info(logMetadata, 'writing files to disk');

      await Promise.all(
        Object.keys(files).map(async (platform) => {
          const dir = path.join(config.tmpdir, 'output', `${handle}-${platform}`);

          await Promise.all(
            Object.keys(files[platform]).map(async (file) => {
              const filename = path.join(dir, file);

              await mkdir(path.dirname(filename));
              await writeFile(filename, files[platform][file]);
            }),
          );

          await writeFile(path.join(dir, '.done'), '');
        }),
      );
    } else {
      logger.info(logMetadata, 'uploading files');
      await Promise.all(
        Object.keys(files).map(async (platform) => {
          const promises: Promise<any>[] = Object.keys(files[platform]).map((file, i, arr) => {
            logger.info(
              {
                ...logMetadata,
                file,
                platform,
                current: i + 1,
                total: arr.length,
              },
              `uploading artifact for platform: ${platform}`,
            );
            return uploadFile(`${handle}-${platform}/${file}`, files[platform][file]);
          });

          if (latestHandle) {
            logger.info(logMetadata, `adding latest link: ${latestHandle}-${platform}`);
            promises.push(
              addS3Redirect(
                `${latestHandle}-${platform}/bundle.js`,
                `${handle}-${platform}/bundle.js`,
              ),
              addS3Redirect(`${latestHandle}-${platform}/.done`, `${handle}-${platform}/.done`),
            );
          }

          await Promise.all(promises);

          logger.info(
            { ...logMetadata, platform, hash },
            `marking platform as complete: ${platform}`,
          );
          await uploadFile(`${handle}-${platform}/.done`, Buffer.alloc(0));

          if (latestHandle) {
            client.set(latestCompletedVersionRedisId, version);
          }

          logger.info(
            { ...logMetadata, platform },
            `finished uploading artifacts for platform: ${platform}`,
          );
        }),
      );
    }

    logger.info(logMetadata, `marking id as finished`);
    client.del(buildStatusRedisId);
  } catch (error) {
    const isClientError = error instanceof UnbundleablePackageError;
    const log = isClientError ? logger.warn.bind(logger) : logger.error.bind(logger);
    log(
      { ...logMetadata, error },
      `unable to bundle, removing key from redis. error: ${error.message}`,
    );
    // Remove at a delay so we don't keep retrying
    client
      .multi()
      .hmset(buildStatusRedisId, {
        type: 'error',
        message: error.message,
        ...(isClientError && { errorName: error.name }),
      })
      .expire(buildStatusRedisId, 60 * 5)
      .exec();
    if (config.sentry && !isClientError) {
      raven.captureException(error);
    }
  } finally {
    if (!process.env.DEBUG_LOCAL_FILES) {
      // TODO: replace rimraf with fs.rm once node 14.40 lands
      rimraf(dir);
    }
  }

  logger.info(logMetadata, `done! cleaning up`);
  return { name: fullName, version: pkg.version, pending: true };
}

import fetchBundle, { BundleResponse } from './fetchBundle';
import fetchMetadata from './fetchMetadata';
import findVersion from './findVersion';
import type { BundleRequest } from './parseRequest';
import resolveDependencies from './resolveDependencies';
import { PackageNotFoundError, UnbundleablePackageError } from '../errors';
import { createRedisClient } from '../external/redis';
import logger from '../logger';

const redisClient = createRedisClient();

export default async function servePackage({
  qualified,
  scope,
  id,
  tag,
  deep,
  platforms,
  rebuild,
  bypassMetadataCache,
  versionSnackager,
  sdkVersion,
}: BundleRequest): Promise<BundleResponse> {
  const meta = await fetchMetadata(qualified, {
    scope,
    id,
    bypassCache: bypassMetadataCache,
    redisClient,
  });
  const { version, isLatest } = findVersion(qualified, meta, tag);
  const { pkg, dependencies, hash, latestHash } = resolveDependencies(
    meta,
    version,
    isLatest,
    deep,
  );

  try {
    const result = await fetchBundle({
      pkg,
      version,
      deep,
      platforms,
      rebuild,
      dependencies,
      hash,
      latestHash,
      versionSnackager,
      sdkVersion,
    });

    return result;
  } catch (e) {
    if (e instanceof PackageNotFoundError) {
      logger.warn({ pkg, error: e }, `package not found in the registry`);
    } else if (e instanceof UnbundleablePackageError) {
      logger.warn({ pkg, error: e }, `package cannot be bundled for the Snack runtime`);
    } else {
      logger.error({ pkg, error: e }, `unexpected error while serving package`);
    }
    throw e;
  }
}

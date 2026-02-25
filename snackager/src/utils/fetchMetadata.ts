import fetch from 'node-fetch';

import config from '../config';
import { PackageNotFoundError } from '../errors';
import { RedisClient } from '../external/redis';
import logger from '../logger';
import { Metadata } from '../types';

type Options = {
  scope?: string | null;
  id: string;
  bypassCache?: boolean;
  redisClient?: RedisClient;
};

const EXPIRATION_SECONDS = 60 * 60;

export default async function fetchMetadata(
  qualified: string,
  { scope, id, bypassCache, redisClient }: Options,
): Promise<Metadata> {
  let response;

  const logMetadata = {
    pkg: {
      name: qualified,
    },
  };

  // TODO: optimize when exact version is specified?
  try {
    const redisId = `snackager/registryMetadata/${
      scope ? `@${encodeURIComponent(`${scope}/`)}` : ''
    }${encodeURIComponent(id)}`;

    if (redisClient) {
      const cachedResult = await new Promise<string | null>((resolve) =>
        redisClient.get(redisId, (err, value) => {
          if (err) {
            resolve(null);
          } else {
            resolve(value);
          }
        }),
      );

      if (!bypassCache && cachedResult) {
        // Metadata is cached in Redis
        return JSON.parse(cachedResult);
      }
    }

    const url = `${config.registry}/${
      scope ? `@${encodeURIComponent(`${scope}/`)}` : ''
    }${encodeURIComponent(id)}`;

    // Fetch the package metadata from the registry
    logger.info({ ...logMetadata, qualified, url }, `fetching metadata`);
    response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
      },
      timeout: 10000,
    });

    if (response.status !== 200) {
      const error = new Error(response.statusText);
      if (response.status === 404) {
        error.name = 'NotFoundError';
      }
      throw error;
    }

    try {
      const json = await response.json();
      if (redisClient) {
        redisClient.set(redisId, JSON.stringify(json), 'EX', EXPIRATION_SECONDS);
        logger.info(
          logMetadata,
          `Added package metadata ${redisId} to redis with ${EXPIRATION_SECONDS}s expiration.`,
        );
      }

      return json;
    } catch (e) {
      logger.error({ ...logMetadata, qualified, e }, `error in parsing: ${e.toString()}`);
      throw new Error(`Failed to parse the response for "${qualified}"`);
    }
  } catch (e) {
    logger.error({ ...logMetadata, qualified, e }, `error in fetching: ${e.toString()}`);
    if (e.name === 'NotFoundError') {
      throw new PackageNotFoundError(`Package "${qualified}" not found in the registry`);
    }
    throw new Error(`Failed to fetch "${qualified}" from the registry`);
  }
}

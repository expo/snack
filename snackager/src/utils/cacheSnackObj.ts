import json5 from 'json5';

import config from '../config';
import { s3 } from '../external/aws';
import logger from '../logger';
import { GitSnackObj } from '../types';

export async function getCachedObj(filename: string): Promise<GitSnackObj | undefined> {
  try {
    var s3Response = await s3
      .getObject({
        Bucket: config.s3.imports_bucket,
        Key: filename,
      })
      .promise();
  } catch (e) {
    return;
  }
  if (!s3Response.Body) {
    return undefined;
  }
  return json5.parse(s3Response.Body.toString());
}

export async function cacheObj(snackObj: GitSnackObj, filename: string): Promise<void> {
  try {
    await s3
      .upload({
        Bucket: config.s3.imports_bucket,
        Key: filename,
        Body: json5.stringify(snackObj),
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000',
      })
      .promise();
  } catch (e) {
    logger.error({ e, filename, bucket: config.s3.imports_bucket }, 'unable to upload file to s3');
    throw new Error('CacheObj failure: ' + e.message);
  }
}

export async function removeFromCache(filename: string): Promise<void> {
  try {
    await s3
      .deleteObject({
        Bucket: config.s3.imports_bucket,
        Key: filename,
      })
      .promise();
  } catch (e) {
    // Ignore error
  }
}

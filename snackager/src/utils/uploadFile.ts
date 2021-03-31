import config from '../config';
import { s3, S3 } from '../external/aws';
import logger from '../logger';

export default async function uploadFile(
  key: string,
  body: Buffer
): Promise<S3.ManagedUpload.SendData | undefined> {
  try {
    return await s3
      .upload({
        Bucket: config.s3.bucket,
        Key: key,
        Body: body,
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000',
      })
      .promise();
  } catch (error) {
    logger.error({ error, key, bucket: config.s3.bucket }, 'unable to upload file to s3');
  }
  return undefined;
}

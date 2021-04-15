import aws from 'aws-sdk';

import config from '../config';

export type { S3 } from 'aws-sdk';

aws.config.update({
  accessKeyId: config.aws.access_key,
  secretAccessKey: config.aws.secret_key,
  region: config.s3.region,
});

export function createS3Client(options: aws.S3.ClientConfiguration = {}): aws.S3 {
  return new aws.S3(options);
}

export const s3 = new aws.S3();

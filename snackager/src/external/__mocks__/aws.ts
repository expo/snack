// This isn't originally exported, but used as default new S3 client.
// It's exported here to access it when testing
export const s3Client = {
  deleteObject: jest.fn(),
  getObject: jest.fn(),
  putObject: jest.fn(),
  upload: jest.fn(),
};

export const createS3Client = jest.fn(() => s3Client);
export const s3 = s3Client;

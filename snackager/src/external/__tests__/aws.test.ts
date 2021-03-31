import aws from 'aws-sdk';

// Need to require actual AWS, not the mock
const { createS3Client, s3 } = jest.requireActual('../aws');

jest.mock('../../config', () => ({
  s3: { region: 'eu-west-1' },
  aws: {
    access_key: 'access_key',
    secret_key: 'secret_key',
  },
}));

jest.mock('aws-sdk', () => ({
  config: {
    update: jest.fn(),
  },
  S3: jest.fn(() => ({ method: () => {} })),
}));

it('sets global aws configuration', () => {
  expect(aws.config.update).toBeCalledWith({
    accessKeyId: 'access_key',
    secretAccessKey: 'secret_key',
    region: 'eu-west-1',
  });
});

it('exports s3 factory', () => {
  expect(createS3Client).toBeInstanceOf(Function);
});

it('exports shared s3 client', () => {
  expect(s3).toBeInstanceOf(Object);
});

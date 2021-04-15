import { s3 } from '../../external/__mocks__/aws';
import uploadFile from '../uploadFile';

jest.mock('../../config', () => ({ s3: { bucket: 'bucket' } }));

const testBody = Buffer.from('content');

afterEach(() => {
  s3.upload.mockClear();
});

it('uploads new file to s3', async () => {
  s3.upload.mockReturnValue({
    promise: async () => ({
      ETag: '"6805f2cfc46c0f04559748bb039d69ae"',
      VersionId: 'tpf3zF08nBplQK1XLOefGskR7mGDwcDk',
    }),
  });
  expect(await uploadFile('my-file', testBody)).toMatchObject({
    ETag: '"6805f2cfc46c0f04559748bb039d69ae"',
    VersionId: 'tpf3zF08nBplQK1XLOefGskR7mGDwcDk',
  });
  expect(s3.upload).toBeCalledWith(
    expect.objectContaining({
      ACL: 'public-read',
      Body: testBody,
      Bucket: 'bucket',
      Key: 'my-file',
    })
  );
});

it('doesnt throw on error', async () => {
  s3.upload.mockReturnValue({
    promise: async () => {
      throw new Error();
    },
  });
  expect(await uploadFile('my-file', testBody)).toBeUndefined();
});

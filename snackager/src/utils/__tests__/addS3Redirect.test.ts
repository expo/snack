import { s3 } from '../../external/__mocks__/aws';
import addS3Redirect from '../addS3Redirect';

jest.mock('../../config', () => ({ s3: { bucket: 'bucket' } }));

afterEach(() => {
  s3.putObject.mockClear();
});

it('stores new s3 website redirect', async () => {
  s3.putObject.mockReturnValue({
    promise: async () => ({
      ETag: '"6805f2cfc46c0f04559748bb039d69ae"',
      VersionId: 'tpf3zF08nBplQK1XLOefGskR7mGDwcDk',
    }),
  });
  expect(await addS3Redirect('from', 'to')).toMatchObject({
    ETag: '"6805f2cfc46c0f04559748bb039d69ae"',
    VersionId: 'tpf3zF08nBplQK1XLOefGskR7mGDwcDk',
  });
  expect(s3.putObject).toBeCalledWith(
    expect.objectContaining({
      ACL: 'public-read',
      Body: '',
      Bucket: 'bucket',
      Key: 'from',
      WebsiteRedirectLocation: '/to',
    })
  );
});

it('doesnt throw on error', async () => {
  s3.putObject.mockReturnValue({
    promise: async () => {
      throw new Error();
    },
  });
  expect(await addS3Redirect('from', 'to')).toBeUndefined();
});

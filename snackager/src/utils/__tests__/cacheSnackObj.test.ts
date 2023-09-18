import { s3 } from '../../external/__mocks__/aws';
import { GitSnackObj } from '../../types';
import { getCachedObj, cacheObj, removeFromCache } from '../cacheSnackObj';

jest.mock('../../config', () => ({ s3: { imports_bucket: 'imports' } }));

const testSnackObject: GitSnackObj = {
  date: new Date().toISOString(),
  sdkVersion: '39.0.0',
  dependencies: {},
  files: {},
};

describe('cacheObj', () => {
  afterEach(() => {
    s3.upload.mockClear();
  });

  it('stores file to cache on s3', async () => {
    s3.upload.mockReturnValue({
      promise: async () => ({
        Body: JSON.stringify(testSnackObject),
      }),
    });
    expect(await cacheObj(testSnackObject, 'my-file')).toBeUndefined();
    expect(s3.upload).toBeCalledWith(
      expect.objectContaining({
        ACL: 'public-read',
        Body: expect.any(String),
        Bucket: 'imports',
        Key: 'my-file',
      }),
    );
  });

  it('throws on error', async () => {
    s3.upload.mockReturnValue({
      promise: async () => {
        throw new Error('test');
      },
    });
    await expect(cacheObj(testSnackObject, 'my-file')).rejects.toThrowError(
      'CacheObj failure: test',
    );
  });
});

describe('getCachedObj', () => {
  afterEach(() => {
    s3.getObject.mockClear();
  });

  it('retrieves cached file from s3', async () => {
    s3.getObject.mockReturnValue({
      promise: async () => ({
        Body: JSON.stringify({ file: { name: 'cached' } }),
      }),
    });
    expect(await getCachedObj('my-file')).toHaveProperty('file.name', 'cached');
    expect(s3.getObject).toBeCalledWith({
      Bucket: 'imports',
      Key: 'my-file',
    });
  });

  it('doesnt throw on error', async () => {
    s3.getObject.mockReturnValue({
      promise: async () => {
        throw new Error();
      },
    });
    expect(await getCachedObj('my-file')).toBeUndefined();
  });
});

describe('removeFromCache', () => {
  afterEach(() => {
    s3.deleteObject.mockClear();
  });

  it('removes cached file from s3', async () => {
    s3.deleteObject.mockReturnValue({
      promise: async () => '',
    });
    expect(await removeFromCache('my-file')).toBeUndefined();
    expect(s3.deleteObject).toBeCalledWith(
      expect.objectContaining({
        Bucket: 'imports',
        Key: 'my-file',
      }),
    );
  });

  it('doesnt throw on error', async () => {
    s3.deleteObject.mockReturnValue({
      promise: async () => {
        throw new Error();
      },
    });
    expect(await removeFromCache('my-file')).toBeUndefined();
  });
});

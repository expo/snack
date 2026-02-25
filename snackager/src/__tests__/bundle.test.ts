import supertest from 'supertest';

import createApp from '../app';
import { PackageNotFoundError, UnbundleablePackageError } from '../errors';
import * as servePackageModule from '../utils/servePackage';

jest.mock('../utils/servePackage');

const mockedServePackage = servePackageModule.default as jest.MockedFunction<
  typeof servePackageModule.default
>;

function request(): supertest.SuperTest<supertest.Test> {
  return supertest(createApp());
}

describe('/bundle/', () => {
  it('returns 404 for PackageNotFoundError', async () => {
    mockedServePackage.mockRejectedValue(
      new PackageNotFoundError('Package "nonexistent" not found in the registry'),
    );

    const response = await request().get('/bundle/nonexistent@1.0.0?platforms=ios');

    expect(response.status).toBe(404);
    expect(response.text).toContain('not found in the registry');
    expect(response.text).toContain('Verify the package name and version');
  });

  it('returns 422 for UnbundleablePackageError', async () => {
    mockedServePackage.mockRejectedValue(
      new UnbundleablePackageError(
        'Cannot resolve module crypto after installing it as a dependency',
      ),
    );

    const response = await request().get('/bundle/bcrypt@5.1.1?platforms=ios');

    expect(response.status).toBe(422);
    expect(response.text).toContain('Cannot resolve module crypto');
    expect(response.text).toContain('cannot be bundled for the Snack runtime');
  });

  it('returns 500 for unexpected errors', async () => {
    mockedServePackage.mockRejectedValue(new Error('ENOENT: no such file or directory'));

    const response = await request().get('/bundle/some-package@1.0.0?platforms=ios');

    expect(response.status).toBe(500);
    expect(response.text).toContain('ENOENT');
  });

  it('does not report PackageNotFoundError to Sentry', async () => {
    const raven = require('raven');
    jest.spyOn(raven, 'captureException');

    mockedServePackage.mockRejectedValue(
      new PackageNotFoundError('Package "nonexistent" not found in the registry'),
    );

    await request().get('/bundle/nonexistent@1.0.0?platforms=ios');

    expect(raven.captureException).not.toHaveBeenCalled();
  });

  it('does not report UnbundleablePackageError to Sentry', async () => {
    const raven = require('raven');
    jest.spyOn(raven, 'captureException');

    mockedServePackage.mockRejectedValue(
      new UnbundleablePackageError('Cannot resolve module crypto'),
    );

    await request().get('/bundle/bcrypt@5.1.1?platforms=ios');

    expect(raven.captureException).not.toHaveBeenCalled();
  });
});

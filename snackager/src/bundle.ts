import { Request, Response } from 'express';
import querystring from 'querystring';
import raven from 'raven';

import config from './config';
import { PackageNotFoundError, UnbundleablePackageError } from './errors';
import parseRequest, { BundleRequest } from './utils/parseRequest';
import servePackage from './utils/servePackage';

export default async function bundle(req: Request, res: Response): Promise<void> {
  let request: BundleRequest;
  try {
    request = parseRequest(querystring.unescape(req.url).replace(/^\/bundle/, ''));
  } catch (e) {
    res.status(400);
    res.end(e.message);
    return;
  }

  try {
    const result = await servePackage(request);

    // TODO: add Cache-Control headers
    res.status(200);
    res.end(JSON.stringify(result));
  } catch (e) {
    if (e instanceof PackageNotFoundError) {
      res.status(404);
      res.end(
        `${e.message}. The package name may be misspelled, the version may not exist, ` +
          `or the package may have been unpublished. ` +
          `Verify the package name and version on the npm registry.`,
      );
    } else if (e instanceof UnbundleablePackageError) {
      res.status(422);
      res.end(
        `${e.message}. This package cannot be bundled for the Snack runtime because it ` +
          `depends on modules that are unavailable in the browser or on native platforms. ` +
          `Try using a different package that supports the target platforms.`,
      );
    } else {
      if (config.sentry) {
        raven.captureException(e);
      }
      res.status(500);
      res.end(e.message);
    }
  }
}

import { Request, Response } from 'express';
import querystring from 'querystring';
import raven from 'raven';

import config from './config';
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
    if (config.sentry) {
      raven.captureException(e);
    }
    res.status(500);
    res.end(e.message);
  }
}

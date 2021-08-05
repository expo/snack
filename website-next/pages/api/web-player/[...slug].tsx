import nullthrows from 'nullthrows';
import fetch, { HeadersInit } from 'node-fetch';
import type { NextApiRequest, NextApiResponse } from 'next';

// /web-player/:version/(.*)
export default async function webPlayer(req: NextApiRequest, res: NextApiResponse) {
  const slug = req.query.slug as string[];
  const version = slug[0];

  // As of SDK 40, this end-point is no longer used in production environments and content
  // is served from S3 directly. This end-point is used for legacy (pre SDK 40) web-players
  // and when testing the web-player locally (serving from https://localhost:19006)
  // TODO: Remove SNACK_WEBPLAYER_CDN after SDK 39 is no longer supported.
  const isRedirect = slug.length >= 2 && slug[1] === 'index.html';
  const baseURL = nullthrows(
    isRedirect && (process.env.NODE_ENV === 'production' || process.env.SNACK_WEBPLAYER_CDN)
      ? process.env.SNACK_WEBPLAYER_CDN
      : process.env.SNACK_WEBPLAYER_URL
  );
  const isLocalhost = version === 'localhost' && process.env.NODE_ENV === 'development';
  const url = `${isLocalhost ? 'http://localhost:19006' : `${baseURL}/${version}`}${req.url.replace(
    `/web-player/${version}`,
    ''
  )}`;

  // Redirect all files, except for `index.html` which is loaded
  // from the same domain in order to prevent cross-origin iFrame
  // issues and an inability to communicate with the web-app.
  if (isRedirect) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.redirect(302, url);
    return;
  }

  const headers = { ...req.headers };
  delete headers.cookie;
  delete headers.host;

  try {
    const response = await fetch(url, {
      headers: headers as HeadersInit,
      method: req.method,
    });

    response.headers.forEach((value, name) => {
      switch (name) {
        case 'transfer-encoding':
          // Piping the stream automatically sets `transfer-encoding`
          // Setting it twice breaks the stream.
          break;
        case 'content-encoding':
          // node-fetch decodes the stream
          break;
        default:
          res.setHeader(name, value);
          break;
      }
    });

    const stream = response.body;
    stream.on('error', () => {
      // Unhandled stream errors cause the app to crash.
      // Intercept it, but there is no need to log it
      // as this is already done in `app.on('error')`
    });
    res.status(response.status).send(stream);
  } catch (e) {
    if (isLocalhost && e.message.includes('ECONNREFUSED')) {
      res
        .status(200)
        .send(
          'Local web-player is not running.\n\nStart it using "expo start" from the "snack/runtime" directory.'
        );
      return;
    }
    console.log(e);
    throw e;
  }
}

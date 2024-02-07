import { StyleSheetServer } from 'aphrodite';
import { Context } from 'koa';
import compose from 'koa-compose';
import Router from 'koa-router';
import send from 'koa-send';
import { customAlphabet } from 'nanoid';
import fetch from 'node-fetch';
import nullthrows from 'nullthrows';
import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import { StaticRouter } from 'react-router-dom';
import { standardizeDependencies } from 'snack-sdk';
import { URL } from 'url';

import * as EmbeddedSnackScript from './EmbeddedSnackScript';
import Document from './pages/Document';
import getSplitTests from './utils/getSplitTests';
import { getAuthStorageKey } from '../client/auth/config';
import PreferencesProvider from '../client/components/Preferences/PreferencesProvider';
import ClientRouter from '../client/components/Router';
import ServiceWorkerManager from '../client/components/ServiceWorkerManager';
import ThemeProvider from '../client/components/ThemeProvider';
import createStore from '../client/redux/createStore';
import type { RouterData, SnackDefaults, QueryParams } from '../client/types';
import { getSnackWebsiteURL } from '../client/utils/getWebsiteURL';
import { getSnackName } from '../client/utils/projectNames';
import { redirectToDevDomain } from '../expo-dev-migration';

// + and - are used as delimiters in the uri, ensure they do not appear in the channel itself
const createChannel = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  10
);

const render = async (ctx: Context) => {
  if (redirectToDevDomain(ctx)) return;

  const id = ctx.params
    ? ctx.params.id
      ? ctx.params.id
      : ctx.params.username && ctx.params.projectName
      ? `@${ctx.params.username}/${encodeURIComponent(ctx.params.projectName)}`
      : null
    : null;

  const splitTestSettings = await getSplitTests(ctx);

  let data: RouterData;
  let queryParams: QueryParams = ctx.query;

  const defaults: SnackDefaults = {
    name: getSnackName(),
    channel: createChannel(),
  };

  const expoSession = ctx.cookies.get(`${getAuthStorageKey()}.sessionSecret`);

  if (id) {
    try {
      const response = await fetch(
        `${nullthrows(process.env.API_SERVER_URL)}/--/api/v2/snack/${id}`,
        {
          headers: {
            'Snack-Api-Version': '3.0.0',
            ...(expoSession ? { 'expo-session': decodeURIComponent(expoSession) } : {}),
          },
        }
      );

      const text = await response.text();
      const json = JSON.parse(text);

      if (json.errors?.length) {
        data = {
          type: 'error',
          error: { message: 'Server returned errors when fetching data' },
          defaults,
        };
      } else {
        data = {
          type: 'success',
          snack: {
            ...json,
            // Convert dependencies from V1 and V2 formats to the latest format
            dependencies: standardizeDependencies(json.dependencies),
          },
          defaults,
        };
      }
    } catch (error) {
      data = {
        type: 'error',
        error: { message: error.message },
        defaults,
      };
    }
  } else {
    if (ctx.request.body) {
      queryParams = {
        ...ctx.request.body,
        ...queryParams,
      };
    }
    data = {
      type: 'success',
      defaults,
    };
  }

  const store = createStore({ splitTestSettings });
  const context: { url?: string } = {};
  const cookies = {
    get: (key: string) => {
      const result = ctx.cookies.get(key);

      if (result) {
        return decodeURIComponent(result);
      }

      return result;
    },
  };
  const isEmbedded = ctx.url.replace(/^\//, '').split('/')[0].split('?')[0] === 'embedded';
  const userAgent = ctx.request.headers['user-agent'];

  const index =
    '<!DOCTYPE html>' +
    ReactDOMServer.renderToStaticMarkup(
      <Document
        id={id}
        isEmbedded={isEmbedded}
        isAuthenticated={!!expoSession}
        splitTestSettings={splitTestSettings}
        data={data}
        queryParams={queryParams}
        content={StyleSheetServer.renderStatic(() => {
          return ReactDOMServer.renderToString(
            <>
              <ServiceWorkerManager />
              <Provider store={store}>
                <PreferencesProvider cookies={cookies} queryParams={queryParams}>
                  <ThemeProvider>
                    <StaticRouter location={ctx.request.url} context={context}>
                      <ClientRouter
                        ctx={ctx}
                        data={data}
                        queryParams={queryParams}
                        userAgent={userAgent}
                      />
                    </StaticRouter>
                  </ThemeProvider>
                </PreferencesProvider>
              </Provider>
            </>
          );
        })}
      />
    );

  if (context.url) {
    ctx.redirect(context.url);
  } else {
    ctx.body = index;
    ctx.type = 'html';
  }
};

export default function routes() {
  const router = new Router();

  router.get('/favicon.ico', async (ctx: Context) => {
    await send(ctx, 'favicon.ico');
  });

  if (process.env.NODE_ENV === 'development') {
    router.get('/embed.js/test', async (ctx: Context) => {
      ctx.type = 'html';
      ctx.body = `<!DOCTYPE html><html><body><div
        data-snack-code="export default function() { return null; };"
        data-snack-preview="false"
        data-snack-platform="web"
        data-snack-theme="light"
        data-snack-supportedPlatforms="web"
        data-snack-name="My Snack"
        data-snack-description="My Description"
        data-snack-sdkVersion="38.0.0"
        data-snack-loading="lazy"
        style="overflow:hidden;background:#fafafa;border:1px solid rgba(0,0,0,.08);border-radius:4px;height:503px;width:788px"></div>
        <script async src="${getSnackWebsiteURL()}/embed.js"></script>
      </body></html>
      `;
    });
  }

  router.get('/embed.js', async (ctx: Context) => {
    ctx.type = 'application/javascript';
    ctx.set('ETag', EmbeddedSnackScript.hash);
    ctx.set('Cache-Control', 'public');
    ctx.body = EmbeddedSnackScript.script;
  });

  router.get('/web-player/:version/(.*)', async (ctx: Context) => {
    // As of SDK 40, this end-point is no longer used in production environments and content
    // is served from S3 directly. This end-point is used for legacy (pre SDK 40) web-players
    // and when testing the web-player locally (serving from https://localhost:19006)
    // TODO: Remove SNACK_WEBPLAYER_CDN after SDK 39 is no longer supported.
    const isRedirect = !ctx.request.path.endsWith('/index.html');
    const baseURL = nullthrows(
      isRedirect && (process.env.NODE_ENV === 'production' || process.env.SNACK_WEBPLAYER_CDN)
        ? process.env.SNACK_WEBPLAYER_CDN
        : process.env.SNACK_WEBPLAYER_URL
    );
    const isLocalhost =
      ctx.params.version === 'localhost' && process.env.NODE_ENV === 'development';
    const url = new URL(
      isLocalhost ? 'http://localhost:19006' : `${baseURL}/${ctx.params.version}`
    );
    url.pathname =
      url.pathname +
      ctx.request.path.replace(
        isLocalhost ? /^\/web-player\/localhost/ : /^\/web-player\/[0-9]+/,
        ''
      );
    url.search = ctx.request.search;

    // Redirect all files, except for `index.html` which is loaded
    // from the same domain in order to prevent cross-origin iFrame
    // issues and an inability to communicate with the web-app.
    if (isRedirect) {
      ctx.status = 302;
      ctx.response.set('Cache-Control', 'public, max-age=3600');
      ctx.response.redirect(url.toString());
      return;
    }

    const headers = { ...ctx.request.headers };
    delete headers.cookie;
    delete headers.host;

    try {
      const response = await fetch(url.toString(), {
        headers,
        method: ctx.request.method,
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
            ctx.set(name, value);
            break;
        }
      });

      const stream = response.body;
      stream.on('error', () => {
        // Unhandled stream errors cause the app to crash.
        // Intercept it, but there is no need to log it
        // as this is already done in `app.on('error')`
      });
      ctx.body = stream;
      ctx.status = response.status;
    } catch (e) {
      if (isLocalhost && e.message.includes('ECONNREFUSED')) {
        ctx.body =
          'Local web-player is not running.\n\nStart it using "expo start" from the "snack/runtime" directory.';
        ctx.status = 200;
        return;
      }
      console.log(e);
      ctx.throw(e);
    }
  });

  router.get('/embedded/@:username/:projectName+', render);
  router.get('/embedded/:id', render);
  router.get('/embedded', render);
  router.get('/@:username/:projectName+', render);
  router.get('/:id', render);
  router.get('*', render);
  router.post('*', render);

  return compose([router.routes(), router.allowedMethods()]);
}

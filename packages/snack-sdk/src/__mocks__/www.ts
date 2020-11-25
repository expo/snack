import Router from '@koa/router';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

import type { SnackFiles } from '..';

export default function createWww() {
  const app = new Koa();
  app.use(bodyParser());
  const router = new Router();
  router.post('/--/api/v2/snack/save', (ctx) => {
    try {
      // @ts-ignore
      const code: SnackFiles = ctx.request.body.code;
      if (!code['App.js'] && !code['App.tsx']) {
        throw new Error('Invalid entry point');
      }
      const key = '@snack-sdk/test';
      ctx.body = {
        id: key,
        key,
        hashId: '00000000',
      };
    } catch (e) {
      ctx.status = 500;
      ctx.body = e.message;
    }
  });
  router.post('/--/api/v2/snack/uploadAsset', (ctx) => {
    const hash = 'FDFDFDFDFDFDFD';
    ctx.body = {
      url: `https://snack-code-uploads.s3.us-west-1.amazonaws.com/~asset/${hash}`,
      hash,
    };
  });
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}

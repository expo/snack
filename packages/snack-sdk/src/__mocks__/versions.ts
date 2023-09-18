import Router from '@koa/router';
import Koa from 'koa';

export type VersionsConfig = {
  [key: string]: {
    [key: string]: string;
  };
};

export default function createApp(
  config: VersionsConfig = require('../__fixtures__/bundledNativeModules.json'),
) {
  const app = new Koa();
  const router = new Router();
  router.get('/expo@:sdkVersion/bundledNativeModules.json', (ctx) => {
    try {
      const sdkVersion: string = ctx.params.sdkVersion;
      const versions = config[sdkVersion];
      if (!versions) throw new Error(`SDK version '${sdkVersion}' not supported`);
      ctx.body = versions;
    } catch (e) {
      ctx.status = 500;
      ctx.body = e.message;
    }
  });
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}

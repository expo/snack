import Router from '@koa/router';
import Koa, { Context } from 'koa';

import defaultConfig, { SnackagerConfig } from '../__fixtures__/snackager';

export default function createSnackager(config: SnackagerConfig = defaultConfig) {
  const app = new Koa();
  const router = new Router();
  function _bundle(ctx: Context, bundleKey: string) {
    try {
      const bundle = config.bundles[bundleKey];
      if (!bundle) throw new Error(`Package '${bundleKey}' not found in the registry`);
      const idx = bundleKey.lastIndexOf('@');
      if (idx < 0) throw new Error('Invalid request, version not specified');
      const name = bundleKey.substring(0, idx);
      const version = bundle.version ?? bundleKey.substring(idx + 1);
      ctx.body = {
        name,
        version,
        hash: `${name}@${version}`,
        handle: `snackager-1/${name.replace('/', '~')}@${version}`,
        dependencies: bundle.peerDependencies,
      };
    } catch (e: any) {
      ctx.status = 500;
      ctx.body = e.message;
    }
  }
  router.get('/bundle/:key1', (ctx) => _bundle(ctx, ctx.params.key1));
  router.get('/bundle/:key1/:key2', (ctx) => _bundle(ctx, `${ctx.params.key1}/${ctx.params.key2}`));
  app.use(router.routes()).use(router.allowedMethods());
  return app;
}

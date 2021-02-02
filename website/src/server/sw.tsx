import { Context } from 'koa';

export default function sw() {
  return async (ctx: Context, next: () => void) => {
    // Since the service worker is served from /dist/, we need to set this header to allow it to control the page
    ctx.set('Service-Worker-Allowed', '/');

    if (ctx.path === '/dist/sw.bundle.js' || ctx.path === '/dist/build-stats.js') {
      // The browser should never cache the service worker
      // This is the default behaviour of Chrome for service worker
      // We set the headers for browsers with different caching behaviour
      // We also do it for the build-stats file which the service worker imports
      ctx.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      ctx.set('Pragma', 'no-cache');
      ctx.set('Expires', '0');
    }

    await next();
  };
}

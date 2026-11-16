import fs from 'fs';
import type { Context, Next } from 'koa';
import path from 'path';

const files: Record<string, string> = {
  '/worker.js': 'worker.js',
  '/executor.js': 'executor.js',
  '/isolation.html': 'isolation.html',
  '/preview.html': 'preview.html',
  '/sdk-player/index.html': 'sdk-player.html',
  '/sdk-player.js': 'sdk-player.js',
};

/** Opt-in static compiler assets. Existing API/account/save routes remain unchanged. */
export default async function workerCompiler(ctx: Context, next: Next) {
  if (process.env.SNACK_WORKER_COMPILER !== '1' || !ctx.path.startsWith('/worker-compiler/')) {
    await next();
    return;
  }
  const file = files[ctx.path.slice('/worker-compiler'.length)];
  if (ctx.method !== 'GET' || !file) {
    ctx.status = 404;
    return;
  }
  const directory = path.resolve(__dirname, '../../worker-compiler');
  try {
    ctx.set('Cache-Control', 'no-store');
    ctx.set('X-Content-Type-Options', 'nosniff');
    ctx.set('Referrer-Policy', 'no-referrer');
    ctx.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()'
    );
    ctx.type = file.endsWith('.js') ? 'text/javascript' : 'text/html';
    if (file === 'preview.html' || file === 'isolation.html') {
      const policies = JSON.parse(
        await fs.promises.readFile(path.join(directory, 'policies.json'), 'utf8')
      );
      ctx.set('Content-Security-Policy', policies[file.slice(0, -5)]);
    } else if (file === 'sdk-player.html') {
      ctx.set(
        'Content-Security-Policy',
        `default-src 'none'; script-src 'self'; frame-src ${ctx.origin}/worker-compiler/preview.html; style-src 'unsafe-inline'; object-src 'none'; base-uri 'none'; form-action 'none'`
      );
    }
    ctx.body = await fs.promises.readFile(path.join(directory, file));
  } catch {
    ctx.status = 503;
    ctx.body = 'Worker compiler assets are not built';
  }
}

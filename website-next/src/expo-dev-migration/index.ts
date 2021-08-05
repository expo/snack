import { Context } from 'koa';

export function redirectToDevDomain(ctx: Context): boolean {
  // if the incoming request is from snack.expo.io, redirect to snack.expo.dev
  if (
    `${ctx.protocol}://${ctx.hostname}` === process.env.LEGACY_SNACK_SERVER_URL &&
    process.env.SNACK_SERVER_URL
  ) {
    ctx.status = 308;
    ctx.redirect(`${process.env.SNACK_SERVER_URL}${ctx.req.url}`);
    return true;
  } else {
    return false;
  }
}

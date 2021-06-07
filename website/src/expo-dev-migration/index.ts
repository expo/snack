import { Context } from 'koa';

export function isExpoDevEnabled(): boolean {
  const DEPLOY_ENVIRONMENT = process.env.DEPLOY_ENVIRONMENT;

  if (!DEPLOY_ENVIRONMENT) return false;

  if (['development', 'staging'].includes(DEPLOY_ENVIRONMENT)) return true;
  if (['production'].includes(DEPLOY_ENVIRONMENT)) return false;

  return false;
}

// if returns `true`, you were redirected and we should exit parent function
// if returns `false` continue executing routing code
export function transitionToExpoDev(ctx: Context): boolean {
  const isExpoDevRedirectEnabled = isExpoDevEnabled();

  if (
    isExpoDevRedirectEnabled &&
    `${ctx.protocol}://${ctx.hostname}` === process.env.SNACK_SERVER_URL &&
    process.env.SNACK_DOT_DEV_SERVER_URL
  ) {
    ctx.redirect(`${process.env.SNACK_DOT_DEV_SERVER_URL}${ctx.req.url}`);
    return true;
  } else {
    return false;
  }
}

// if returns `true`, you were redirected and we should exit parent function
// if returns `false` continue executing routing code
export function undoTransitionToExpoDev(ctx: Context): boolean {
  const isExpoDevRedirectEnabled = isExpoDevEnabled();

  if (
    isExpoDevRedirectEnabled &&
    `${ctx.protocol}://${ctx.hostname}` === process.env.SNACK_DOT_DEV_SERVER_URL &&
    process.env.SNACK_SERVER_URL
  ) {
    ctx.redirect(`${process.env.SNACK_SERVER_URL}${ctx.req.url}`);
    return true;
  } else {
    return false;
  }
}

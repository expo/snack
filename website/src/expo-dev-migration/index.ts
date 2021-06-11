import { Context } from 'koa';

export function isDevDomainEnabled(): boolean {
  const DEPLOY_ENVIRONMENT = process.env.DEPLOY_ENVIRONMENT;

  if (!DEPLOY_ENVIRONMENT) return false;

  if (['development', 'staging'].includes(DEPLOY_ENVIRONMENT)) return true;
  if (['production'].includes(DEPLOY_ENVIRONMENT)) return false;

  return false;
}

export function redirectToDevDomain(ctx: Context): boolean {
  if (
    isDevDomainEnabled() &&
    `${ctx.protocol}://${ctx.hostname}` === process.env.LEGACY_SNACK_SERVER_URL &&
    process.env.SNACK_SERVER_URL
  ) {
    ctx.redirect(`${process.env.SNACK_SERVER_URL}${ctx.req.url}`);
    return true;
  } else {
    return false;
  }
}

// in the case that we need to rollback the domain redirect,
// run this function in place of redirectToDevDomain
export function redirectToIoDomain(ctx: Context): boolean {
  if (
    isDevDomainEnabled() &&
    `${ctx.protocol}://${ctx.hostname}` === process.env.SNACK_SERVER_URL &&
    process.env.LEGACY_SNACK_SERVER_URL
  ) {
    ctx.redirect(`${process.env.SNACK_SERVER_URL}${ctx.req.url}`);
    return true;
  } else {
    return false;
  }
}

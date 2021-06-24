import { Context } from 'koa';

export function isDevDomainEnabled(): boolean {
  const DEPLOY_ENVIRONMENT = process.env.DEPLOY_ENVIRONMENT;

  console.log('DEPLOY_ENVIRONMENT', DEPLOY_ENVIRONMENT);

  if (!DEPLOY_ENVIRONMENT) return false;

  if (['staging'].includes(DEPLOY_ENVIRONMENT)) return true;
  if (['production'].includes(DEPLOY_ENVIRONMENT)) return false;

  return false;
}

export function redirectToDevDomain(ctx: Context): boolean {
  console.log(`.DEV REDIRECT: ${ctx.protocol}://${ctx.hostname}`);

  console.log('.DEV REDIRECT: isDevDomainEnabled', isDevDomainEnabled());
  console.log('.DEV REDIRECT: ctx.protocol', ctx.protocol);
  console.log('.DEV REDIRECT: ctx.hostname', ctx.hostname);
  console.log('.DEV REDIRECT: ctx.req.url', ctx.req.url);
  console.log(
    '.DEV REDIRECT: process.env.LEGACY_SNACK_SERVER_URL',
    process.env.LEGACY_SNACK_SERVER_URL
  );
  console.log('.DEV REDIRECT: process.env.SNACK_SERVER_URL', process.env.SNACK_SERVER_URL);

  // if the incoming request is from snack.expo.io, redirect to snack.expo.dev
  if (
    isDevDomainEnabled() &&
    `${ctx.protocol}://${ctx.hostname}` === process.env.LEGACY_SNACK_SERVER_URL &&
    process.env.SNACK_SERVER_URL
  ) {
    console.log('.DEV REDIRECT: is redirecting');
    ctx.redirect(`${process.env.SNACK_SERVER_URL}${ctx.req.url}`);
    return true;
  } else {
    console.log('.DEV REDIRECT: is not redirecting');
    return false;
  }
}

// in the case that we need to rollback the domain redirect,
// run this function in place of redirectToDevDomain
export function redirectToIoDomain(ctx: Context): boolean {
  // if the incoming request is from snack.expo.dev, redirect to snack.expo.io
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

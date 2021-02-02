import { getReloadURL } from '../utils/reloadURL';

type LoginHrefOptions = {
  saveToAccount?: boolean;
};

export function getLoginHref(options?: LoginHrefOptions) {
  const reloadURL = getReloadURL({
    hideQueryParams: 'true',
    ...(options?.saveToAccount ? { saveToAccount: 'true' } : {}),
  });
  return `${process.env.SERVER_URL}/login?redirect_uri=${encodeURIComponent(reloadURL)}`;
}

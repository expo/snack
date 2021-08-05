import { getWebsiteURL } from '../utils/getWebsiteURL';
import { getReloadURL } from '../utils/reloadURL';

type LoginHrefOptions = {
  saveToAccount?: boolean;
};

export function getLoginHref(options?: LoginHrefOptions) {
  const reloadURL = getReloadURL({
    hideQueryParams: 'true',
    ...(options?.saveToAccount ? { saveToAccount: 'true' } : {}),
  });
  return `${getWebsiteURL()}/login?redirect_uri=${encodeURIComponent(reloadURL)}`;
}

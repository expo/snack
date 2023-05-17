import querystring from 'query-string';

import type { RouterData, QueryParams, QueryStateParams } from '../types';

export type ReloadURLOptions = {
  noEmbedded?: boolean;
  useAllQueryParamsWhenPossible?: boolean;
};

declare const __INITIAL_DATA__: {
  data: RouterData;
  queryParams: QueryParams;
  splitTestSettings: any;
};

type QueryStateParamKeys = keyof QueryStateParams;

function pickQueryStateParams(queryParams: QueryParams) {
  const res: QueryStateParams = {};
  for (const key in queryParams) {
    const name = key as QueryStateParamKeys;
    /* eslint @typescript-eslint/switch-exhaustiveness-check: 1 */
    switch (name) {
      case 'preview':
      case 'platform':
      case 'theme':
      case 'supportedPlatforms':
      case 'appetizePayerCode':
      case 'verbose':
      case 'deviceFrame':
      case 'deviceAndroid':
      case 'deviceAndroidScale':
      case 'deviceIos':
      case 'deviceIosScale':
      case 'hideQueryParams':
        res[name] = queryParams[name] as any;
        break;
    }
  }
  return res;
}

export function getReloadURL(queryParams?: QueryParams, options?: ReloadURLOptions) {
  const { origin } = window.location;
  let { pathname } = window.location;
  const allQueryParams: any =
    options?.useAllQueryParamsWhenPossible &&
    (!pathname || pathname === '/' || pathname === '/embedded' || pathname === '/embedded/')
      ? { ...__INITIAL_DATA__.queryParams }
      : pickQueryStateParams(__INITIAL_DATA__.queryParams);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value === undefined) {
        delete allQueryParams[key];
      } else {
        allQueryParams[key] = value;
      }
    }
  }
  if (options?.noEmbedded) {
    pathname = pathname.replace('/embedded', '');
  }

  return `${origin}${pathname}?${querystring.stringify(allQueryParams)}`;
}

export function reload() {
  const url = getReloadURL(undefined, {
    useAllQueryParamsWhenPossible: true,
  });
  window.location.replace(url);
}

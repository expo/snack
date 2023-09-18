import type { Server } from 'http';

import createSnackager from './snackager';
import createVersions from './versions';
import createWww from './www';
import { defaultConfig } from '..';

const actualFetch = jest.requireActual('node-fetch');

jest.mock('node-fetch', () => {
  return jest.fn(async (url: string, options: Request) => {
    let server: Server | undefined;

    if (!process.env.SNACK_ENV || process.env.SNACK_ENV === 'mock') {
      // Snackager
      if (url.startsWith(defaultConfig.snackagerURL)) {
        const path = url.substring(defaultConfig.snackagerURL.length);
        server = createSnackager().listen(0);
        // @ts-ignore: Property port does not exist on type AddressInfo | string
        url = `http://127.0.0.1:${server.address().port}${path}`;

        // BundledNativeModules.json
      } else if (url.startsWith('https://cdn.jsdelivr.net/npm/expo@')) {
        const path = url.substring('https://cdn.jsdelivr.net/npm'.length);
        server = createVersions().listen(0);
        // @ts-ignore: Property port does not exist on type AddressInfo | string
        url = `http://127.0.0.1:${server.address().port}${path}`;

        // www
      } else if (url.startsWith(defaultConfig.apiURL)) {
        const path = url.substring(defaultConfig.apiURL.length);
        server = createWww().listen(0);
        // @ts-ignore: Property port does not exist on type AddressInfo | string
        url = `http://127.0.0.1:${server.address().port}${path}`;
        // console.log('WWW: ', path);
      } else {
        console.log('UNKNOWN: ', url);
      }
    }

    try {
      return await actualFetch(url, options);
    } catch (e) {
      throw e;
    } finally {
      server?.close();
    }
  });
});

const mockFetch = require('node-fetch');

beforeEach(() => mockFetch.mockClear());

export default mockFetch;

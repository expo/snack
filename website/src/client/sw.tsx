import resources from '../../resources.json';

declare const self: ServiceWorkerGlobalScope;

declare const __WEBPACK_BUILD_STATS__: {
  hash: string;
  assets: string[];
};

// We write the build statistics to get the hash and list of files to cache
// If you change the filename, also change the caching policy for this file on server
self.importScripts('/dist/build-stats.js');

// The cache name includes hash of the buildso we can maintain separate cache for separate builds
const CACHE_NAME = `cache-${process.env.BUILD_TIMESTAMP ?? 0}-${__WEBPACK_BUILD_STATS__.hash}`;
const ASSETS = __WEBPACK_BUILD_STATS__.assets
  // Requests will include the full URL, so use them for easier checks
  .map((item) => `${self.location.origin}${item}`)
  // Don't cache the service worker itself
  .filter((url) => url !== self.location.href)
  // Also add any other external resources we fetch
  .concat(Object.values(resources));

// Web-player index.html is cached
const WEB_PLAYER_CACHE_NAME = 'cache-web-player';
const WEB_PLAYER_CACHE_MAX_AGE = 300; // 5 minutes
const WEB_PLAYER_REGEXP = /^\/web-player\/[0-9]+\/index\.html/;

self.addEventListener('install', () => {
  // Pre-cache all JavaScript, JSON and CSS code
  // This will skip any other assets such as images, they'll be cached when first requested
  // We don't have this in event.waitUntil because we don't want to wait too long before activating
  // On slower connections, it might take a long time to download all the assets during install
  // So we activate early and the assets can be downloaded when the page is loading
  caches
    .open(CACHE_NAME)
    .then((cache) => cache.addAll(ASSETS.filter((item) => /\.(css|js|json)$/.test(item))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    // Get all the existing cache
    caches.keys().then((names) =>
      // Delete any outdated cache
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME && name !== WEB_PLAYER_CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (ASSETS.includes(event.request.url)) {
    // We got a request for an asset we manage
    return event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        // Check the cache for the item
        return cache.match(event.request).then((response) => {
          // If the item exists in the cache, return it, else do a network request
          return (
            response ??
            fetch(event.request).then((res) => {
              cache.put(event.request, res.clone());
              return res;
            })
          );
        });
      }),
    );
  }

  const shortUrl = event.request.url.substring(self.location.origin.length);
  const webPlayerMatch = shortUrl.match(WEB_PLAYER_REGEXP);
  if (webPlayerMatch) {
    const webPlayerUrl = self.location.origin + webPlayerMatch[0];
    return event.respondWith(
      caches.open(WEB_PLAYER_CACHE_NAME).then((cache) => {
        return cache.match(webPlayerUrl).then((cacheResponse) => {
          // Return the item from cache if possible
          if (cacheResponse) {
            const fetchedOn = cacheResponse.headers.get('sw-fetched-on');
            if (fetchedOn && Date.parse(fetchedOn) + WEB_PLAYER_CACHE_MAX_AGE * 1000 > Date.now()) {
              return cacheResponse;
            }
          }
          // Otherwise do a network request
          return fetch(event.request).then((fetchResponse) => {
            const copy = fetchResponse.clone();
            const headers = new Headers(copy.headers);
            headers.append('sw-fetched-on', new Date().toUTCString());
            copy.blob().then((body) => {
              return cache.put(
                webPlayerUrl,
                new Response(body, {
                  status: copy.status,
                  statusText: copy.statusText,
                  headers,
                }),
              );
            });
            return fetchResponse;
          });
        });
      }),
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    // The client will let us know when the service worker is ready to take over
    self.skipWaiting();
  }
});

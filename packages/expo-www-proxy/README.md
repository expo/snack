# expo-www-proxy

Proxies Expo API requests to `staging.exp.host`, or to a locally running Expo API server (on localhost:3000).

The proxy auto-detects whether the Expo API server is running locally and forwards the requests to the local instance when possible.
By default all requests are proxied to the staging API server.

## Usage

This proxy is automatically started when running `yarn start` from the root.

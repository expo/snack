# expo-website-proxy

Proxies Expo website requests to `staging.expo.io`, or to a locally running Expo website server (on localhost:3001).

The proxy auto-detects whether the Expo website is running locally and forwards the requests to the local instance when possible.
By default all requests are proxied to the [staging website](staging.expo.io).

## Usage

This proxy is automatically started when running `yarn start` from the root.

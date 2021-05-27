# Hosts and Ports

The following hosts and ports are used by Snack.

| Development | Staging | Production | Description |
|---|---|---|---|
| [localhost:3011](http://localhost:3011) ([snack.expo.test](http://snack.expo.test)) | [staging.snack.expo.dev](https://staging.snack.expo.dev) | [snack.expo.io](https://snack.expo.io) | Snack web-app located in `./website`. |
| localhost:3012 (snackager.expo.test) | staging.snackager.expo.io | snackager.expo.io | Snackager bundler service. |
| localhost:3000 | staging.exp.host | exp.host | The Expo API server. |
| localhost:3001 | staging.expo.dev | expo.io | The Expo website. |
| localhost:3020 | - | - | Proxy server that forwards and logs all requests to the local or staging Expo API server. Located in `./packages/snack-proxies`. |
| localhost:3021 | - | - | Proxy server that forwards and logs all requests to the local or staging Expo website. Located in `./packages/snack-proxies`. |
| localhost:3022 | - | - | Proxy server that forwards and logs all requests to the local or staging Snackager service. Located in `./packages/snack-proxies`. |


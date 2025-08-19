# Dependencies and Bundling

Before a dependency can be used with Snack, it needs to be converted into a bundle that is consumable by the Snack runtime. This is done by the Snackager service and happens automatically when you add a dependency to a Snack. The bundling process happens the first time a particular package/version combination is requested. Once the bundle is created, the cached bundle is returned.

## Forcing Snackager to check for newer versions on NPM

When a new package is published to NPM, it may take up to 60 minutes before it is available in Snack. This is because Snackager caches the results from NPM for better performance. Use the following request to force Snackager to re-check for newer versions on NPM, and bundle them appropriately.

```sh
curl "https://snackager.expo.dev/bundle/[name]@[version]?platforms=ios,android,web&version_snackager=true&bypassCache=true"
```

Example:

```sh
curl "https://snackager.expo.dev/bundle/react-native-paper@latest?platforms=ios,android,web&version_snackager=true&bypassCache=true"
```

# Dependencies and Bundling

Before a dependency can be used with Snack, it needs to be converted into a bundle that is consumable by the Snack runtime. This is done by the Snackager service and happens automatically when you add a dependency to a Snack. The bundling process happens the first time a particular package/version combination is requested. Once the bundle is created, the cached bundle is returned.

<!-- # Updating dependencies

In ordinary usage, Snack only looks for new dependencies once per hour.  If you want to use snack to test a release candidate or test your documentation with your newer release, you can force an update by sending a GET request to `https://snackager.expo.io/bundle/MODULE_NAME@VERSION_PIN?bypassCache=true`

-->
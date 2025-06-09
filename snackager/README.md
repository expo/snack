# snackager

Service to generate Expo Snack bundles from NPM packages. This is the API server for snackager.expo.io.

> Before running any Snackager scripts, make sure you have followed **all the steps** in the [Contributing Guide](../CONTRIBUTING.md).

## Test package bundling

Use `yarn bundle [package-spec]` to test bundling of a specific NPM package. This bypasses any caches and does not write any bundles to the S3 bucket.

```sh
yarn bundle react-native-elements | ./node_modules/.bin/bunyan
```

## Run tests

To run all the tests, simply use `yarn test`. Use a suffix to run specific tests:

```sh
yarn test bundler
```

## Development server

> Running the development server is not yet possible for external contributors as it requires protected secrets.

Use `yarn start` to run the Snackager development server. By default the local server will always connect to the staging database and proxy the staging redis proxy. If you'd like to connect them to production instead, edit the `k8s/development/kustomization.yaml` file to include `../production` instead of `../staging` and run `yarn start:production` instead.

To get a bundle, do a `GET` request with the following format:

```sh
/bundle/[name]@[version]?platforms=ios,android
```

Example:

```sh
curl "http://localhost:3012/bundle/react-native-paper@5.12.5?platforms=ios,android,web"
```

You can specify a semver range in `[version]`, e.g. - `^12.4.5`, or omit it to get the `latest` version.

If the module is not bundled yet, the API returns a JSON object with `{ pending: true }` and kicks off the bundling. If the module is already bundled, the API returns a JSON object containing the exact version, hash and list of dependencies of the module. The module can be fetched from S3.

The code is transpiled and bundled with `webpack` and `expo` preset. Any dependencies of the library are bundled as well except `react`, `react-native` and `expo`. To use the code, you'd do something like this:

```js
global.__snack_exports = {};
global.__snack_require = name => {
  switch (name) {
    case 'react':
      return require('react');
    case 'react-native':
      return require('react-native');
    case 'expo':
      return require('expo');
  }
};

eval(`
(function(require, exports) {
  ${code}
  ;
})(global.__snack_require, global.__snack_exports);
`);
```

After the `eval`, the module will be available under `global.__snack_exports`.

### Debugging

Set `DEBUG_LOCAL_FILES=true` to leave temp files and write all files to disk instead of using MemoryFS. This will disable checking for files on S3 and uploading files. The files will be written to `$TMPDIR/snackager`.

> `DEBUG_LOCAL_FILES` is always set to true when running locally. Edit `k8s/development/kustomization.yaml` to change this.

To force rebuilding a package, pass `rebuild=true` when requesting to bundle a package. Note that this can only be enabled when `DEBUG_LOCAL_FILES` is specified.

When `DEBUG_LOCAL_FILES`, you can also fetch the output files at `/serve`, e.g. -

```sh
curl http:/localhost:3012/serve/react-navigation@3.3.2-ios/bundle.js
```

You can replace the cloudfront URL with `http://snackager.expo.test/serve` in the Snack app to debug it with local files. You will need to run `adb reverse tcp:30001 tcp:3001` when debugging on Android device. Don't forget to remove the cache first with `FileSystem.deleteAsync` to remove existing cached version in the Snack app.
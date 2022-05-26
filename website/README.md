# website

This is the web app for [snack.expo.dev](https://snack.expo.dev/) and for [embedded Snacks](https://snack.expo.dev/embedded).

## Getting started

Before running the web app, make sure you have followed **all the steps** in the [Contributing Guide](../CONTRIBUTING.md).

Start the website by running `yarn start` from the root of the repository.

## Running development services locally

When you have access to the Expo Universe repository, you can choose to run certain Expo services locally.

### Expo API server (www)

Start the `www` server. `snack-proxies` automatically detects the local server and routes all trafic to localhost:3000 when possible.

```sh
# expo/universe
cd server/www
yarn
yarn start
```

### Expo Website

Start the Expo website. `snack-proxies` automatically detects the local server and routes all trafic to localhost:3001 when possible.
When testing authentication, it is important that the chalet `expo.test` domain is used, otherwise authentication credentials cannot be accessed by `snack.expo.test`.

```sh
# expo/universe
cd server/website
yarn
yarn start
```

### Snackager (package bundler)

Start the `snackager` server. `snack-proxies` automatically detects the locally running Snackager server and routes all trafic to it when possible.

```sh
# expo/snack
cd snackager
yarn
yarn start
```

### Snack web-player

By default, the web player is loaded from s3 and a CDN. When developing locally, start the web-player locally and select "localhost" in the SDK versions picker.

```sh
# expo/snack
cd runtime
expo start:web
```

### Testing local Snack runtime on device

Use ngrok to set up a tunnel to your locally-running www instance.

1. Replace 'staging.exp.host' with your ngrok url, in the host of the Snack constructor (client/components/App.tsx).
2. Restart local snack server.
3. Send to device.

Note that a some Expo client APIs are hardcoded to prod so they won't hit the ngrok tunnel.


### Disabling cache with Service Worker

In chrome devtools, check "Bypass for network" under `Application` > `Service workers` to skip the service worker cache when working on the page. Remember to keep the devtools open so this takes effect.

### Setting up HTTPS with self-signed certifcate

The service worker needs HTTPS to work on the `snack.expo.test` domain. To set it up with Chalet, we need to add the `cert.pem` and `key.pem` files under the `~/.chalet` directory. To create these files, first create a configuration file for the certificate with the following content (let's call it `req.conf`):

```ini
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no
[req_distinguished_name]
C = US
ST = Oregon
L = Portland
O = Expo
OU = Org
CN = expo.test
[v3_req]
keyUsage = critical, digitalSignature, keyAgreement
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
[alt_names]
DNS.1 = expo.test
DNS.2 = snack.expo.test
```

Then run the following command in the same directory where you created the file to generate the certificate:

```sh
openssl req -x509 -newkey rsa:4096 -sha256 -keyout key.pem -out cert.pem -days 365 -nodes -config req.conf
```

Place the generated `cert.pem` and `key.pem` files under the `~/.chalet` directory and `chalet` should be setup to work with SSL.

You'll also need to add the certificate to the system. Under `Keychain Access` > `Certificates`, drag and drop the `cert.pem` file to do that. Double click the certificate and mark it as trusted under the "Trust" section.

Now, log out and log back in to your computer (or restart) to make Chalet to reload the certificates to serve.

Now you should be able to access the snack server at [https://snack.expo.test](https://snack/expo.test).

## File organization

The web server is under `src/server/`. The build scripts also generate a `build` subdirectory with the compiled JS; this is the JS that actually runs.

The code for the client is located under `src/client/`. The webpack build creates a `dist/` folder which is ignored from version control.

Scripts related to deployment, like the Dockerfile, are under `deploy`. Note: even though the scripts are under `deploy`, you must run them from the **root of the repository**; they are sensitive to `cwd`.

## Query Parameters

You can pass certain parameters in the Snack URL to customize the behavior of the Snack.

Here is a summary of all the parameter options that you can use:

> All query parameter values must be URL encoded

| parameter | default | description | type |
| -------- | ------- | ----------- | ------ |
| **dependencies** | | Comma separated list of <name>@<version>. | [SnackDependency](https://github.com/expo/snack/blob/main/packages/snack-content/src/types.ts#L64) |
| **description** | | The description of your Snack. | `string` |
| **files** | | Allows you to inline files to load through a query param, useful for doc maintainers who don't want to maintain twice the code (both markdown and snack, itself). [Read more about files](https://github.com/expo/snack/blob/main/docs/snack-sdk.md#files-dependencies-and-the-state). | [`SnackFiles`](https://github.com/expo/snack/blob/main/packages/snack-content/src/types.ts#L40) |
| **name** | | The name of your Snack. When creating a new Snack, a random name is assigned unless one is provided via this parameter.  | `string` |
| **platform** | `web` | The platform on which your Snack should be run in the Device Preview window. | `android \| ios \| mydevice \| web` |
| **preview** | `true` | Toggle to show the Device Preview. | `boolean` |
| **sdkVersion** | _[default SDK](../packages/snack-content/src/defaults.ts#L3)_ | The Expo SDK version that your Snack should use. | [SDKVersion](../packages/snack-content/src/sdks/types.ts#L4) |
| **sourceUrl** |  | One of two ways to send a file, via publicly-accessible URL of a JS file. | `string` |
| **supportedPlatforms** | All platforms | Specify which platforms your Snack supports | `android \| ios \| mydevice \| web` |
| **theme** | `light` | The visual theme of your Snack. | `light \| dark` |

### Examples of Snack URLs

All of these examples should be prefixed with `https://snack.expo.dev/`.

| parameter | example |
| --------- | ------- |
| **name** | _[`?name=Gordon%20Freeman`](https://snack.expo.dev/?name=Gordon%20Freeman)_ |
| **description** | _[`?description=Where%20is%20Half-Life%203`](https://snack.expo.dev/?description=Where%20is%20Half-Life%203)_ |
| **platform** | _[`?platform=mydevice`](https://snack.expo.dev/?platform=mydevice)_ |
| **preview** | _[`?preview=false`](https://snack.expo.dev/?preview=false)_ |
| **sdkVerion** | _[`?sdkVersion=45.0.0`](https://snack.expo.dev/?sdkVersion=45.0.0)_ |
| **supportedPlatforms** | _[`?supportedPlatforms=android,ios`](https://snack.expo.dev/?supportedPlatforms=android,ios)_ |
| **theme** | _[`?theme=dark`](https://snack.expo.dev/?theme=dark)_ |
| **dependencies** | _[`?dependencies=%40expo%2Fvector-icons%40*%2C%40react-native-community%2Fmasked-view`](https://snack.expo.dev/?dependencies=%40expo%2Fvector-icons%40*%2C%40react-native-community%2Fmasked-view)_ |
| **files** | _[`?files=`](https://snack.expo.dev/?files={"type": "CODE", "contents": "alert('hello');" })_ |
| **sourceUrl** | _[`?sourceUrl=https://reactnavigation.org/examples/6.x/hello-react-navigation.js`](https://snack.expo.dev/?sourceUrl=https://reactnavigation.org/examples/6.x/hello-react-navigation.js)_ |

## Running the tests

We run unit tests with Jest. Run `yarn test` in another terminal to start Jest and have it continuously watch for changes. You also can run `yarn jest` if you want to run Jest without the watcher. Keep unit tests fast so that the feedback loop from them is fast.


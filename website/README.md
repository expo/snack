# website

This is the web app for [snack.expo.io](https://snack.expo.io/) and for [embedded Snacks](https://snack.expo.io/embedded).

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
# expo/universe
cd server/snackager
yarn
yarn start
```

### Snack web-player

By default, the web player is loaded from s3 and a CDN. When developing locally, specify the `SNACK_WEBPLAYER_URL` and `SNACK_WEBPLAYER_CDN` environment variables to use the local instance of the web player.

```sh
# expo/universe
cd apps/snack
expo start:web
```

Replace the `SNACK_WEBPLAYER_URL` and `SNACK_WEBPLAYER_CDN` values in [./deploy/development/snack.env](./deploy/development/snack.env);

```sh
SNACK_WEBPLAYER_URL=http://localhost:19006
SNACK_WEBPLAYER_CDN=http://localhost:19006
```

And restart

```sh
# expo/snack
yarn start
```

### Testing local Snack runtime on device

Use ngrok to set up a tunnel to your locally-running www instance.

1. Replace 'staging.snack.expo.io' with your ngrok url, in the host of the Snack constructor (client/components/App.tsx).
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

## Running the tests

We run unit tests with Jest. Run `yarn test` in another terminal to start Jest and have it continuously watch for changes. You also can run `yarn jest` if you want to run Jest without the watcher. Keep unit tests fast so that the feedback loop from them is fast.


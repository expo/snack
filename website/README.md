# Snack

Snack lets you to run complete React Native projects in the browser. This is the web app for [snack.expo.io](https://snack.expo.io/).

## NOTE: This README still assumes that you have access to the `expo/universe` repository in order to develop the Snack web-app. We are in the process of removing these dependencies, after which local development will be possible using merely the `expo/snack` monorepo.

## Pre-requisites

Before running the web app, make sure to have the following packages installed globally on your system:

- [nodejs](https://nodejs.org/)
- [yarn](https://yarnpkg.com/lang/en/)
- [docker](https://docker.com)
- [chalet](https://github.com/jeansaad/chalet)

## Getting started

### Quick start

After cloning the repo, open a terminal in the directory and run following to install the dependencies and start the server:

```sh
cd website
yarn
yarn start
```

By default, the Snack server will try to connect to your local `www` server, so you'll need to start that in a separate terminal as well.

```sh
cd {universe}/server/www
yarn
yarn start
```

If you want to use authentication or other website features, also start the "website" in a separate terminal.

```sh
cd {universe}/server/website
yarn
yarn start
```

Now you can access the web app at [localhost:3011](http://localhost:3011) or through [snack.expo.test](http://snack.expo.test) if the test domain was correctly setup.

### Using the `snack.expo.test` domain

We develop Snack under [snack.expo.test](https://snack/expo.test). We use [chalet](https://github.com/jeansaad/chalet) to do that. To set it up, open the file `~/.chalet/conf.json` and make sure you have the `tld` set to `test`:

```json
{
  "tld": "test"
}
```

Also add the following to `~/.chalet/servers/snack.expo.json`:

```json
{
  "target": "http://localhost:3011"
}
```

Configure your system to use configure proxies automatically following [these instructions](https://github.com/jeansaad/chalet/blob/master/docs/README.md#system-configuration-recommended).

Now you should be able to access the snack server at [http://snack.expo.test](http://snack/expo.test).

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

Scripts related to deployment, like the Dockerfile, are under `deploy`. Note: even though the scripts are under `deploy`, you must run them from the root directory; they are sensitive to `cwd`.

### Disabling cache with Service Worker

In chrome devtools, check "Bypass for network" under `Application` > `Service workers` to skip the service worker cache when working on the page. Remember to keep the devtools open so this takes effect.

### Testing the web player locally

By default, the web player is loaded from s3 and a CDN. When developing locally, specify the `SNACK_WEBPLAYER_URL` and `SNACK_WEBPLAYER_CDN` environment variables to use the local instance of the web player.

Example:

```sh
# Start the web-player
cd {universe}/apps/snack
expo start:web

# Start server using localhost web-player
cd website
SNACK_WEBPLAYER_URL=http://localhost:19006 SNACK_WEBPLAYER_CDN=http://localhost:19006 yarn start
```

### Testing Snackager locally

By default, Snackager is used from staging. When developing locally append `local_snackager=true` to the query arguments of the URL.

Example:

```sh
# Start Snackager locally
cd {universe}/server/snackager
yarn start

# Start server and use local Snackager
cd website
yarn start
open "http://snack.expo.test?local_snackager=true"
```

### Running the tests

We run unit tests with Jest. Run `yarn test` in another terminal to start Jest and have it continuously watch for changes. You also can run `yarn jest` if you want to run Jest without the watcher. Keep unit tests fast so that the feedback loop from them is fast.

### Testing local snack on device

Use ngrok to set up a tunnel to your locally-running www instance.

1. Replace 'staging.snack.expo.io' with your ngrok url, in the host of the Snack constructor (client/components/App.tsx).
2. Restart local snack server.
3. Send to device.

Note that a lot of expo client APIs are hardcoded to prod so they won't hit the ngrok tunnel.

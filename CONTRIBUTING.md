# Contributing to Expo Snack

## 📦 Download and Setup

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device. (`git remote add upstream git@github.com:expo/snack.git` 😉)
2. Make sure you have the following packages globally installed on your system:
   - [node](https://nodejs.org/) (node 12 or higher is recommended)
   - [yarn](https://yarnpkg.com/)
   - [gcloud](https://sdk.cloud.google.com)
3. Install the Node packages (`yarn install`)
4. [chalet](https://github.com/jeansaad/chalet) is used to run local services on the `expo.test` domain.
   - Update `~/.chalet/conf.json` to use `{ "tld": "test" }`
   - [Configure your system or browser to use the `.test` domain](https://github.com/jeansaad/chalet/blob/master/docs/README.md#system-configuration-recommended)
   - Restart or refresh your network settings to apply the chalet changes
5. Run `yarn bootstrap` in the root directory to prepare the installation.

## 🏎️ Start the Development environment

Run `yarn start` from the root to start the Snack development services.

> Some services like the Expo API server and the Expo website are hosted elsewhere and are proxied. The proxies log all incoming requests and auto-redirect to locally running instances when possible.

To view the website, open http://snack.expo.test or http://localhost:3011.

### Snackager bundler

All contributors can [test package bundling](./snackager/README#test-package-bundling) and [run the tests](./snackager/README#run-tests). It is currently only possible for Expo developers to run the full Snackager server, which requires access to API keys. *We are working on making this possible for external contributors.*

### Runtime

By default, the latest runtime that was deployed to staging is used. To start the runtime in development, see  [Runtime development](runtime/README.md#development).

## ✅ Testing

Testing is done using [Jest](https://jestjs.io/https://jestjs.io/), the delightful JavaScript Testing Framework.

1. Create a test for your feature in the appropriate `src/__tests__` directory (if the file doesn't exist already, create it with the `*-test.ts` or `*-test.tsx` extension).
2. Run the test with `yarn test` and ensure it completes successfully. Use mocks when possible to reduce dependencies on online services and to speed up the test.

## 📝 Writing a Commit Message

> If this is your first time committing to a large public repo, you could look through this neat tutorial: ["How to Write a Git Commit Message"](https://chris.beams.io/posts/git-commit/)

Commit messages are formatted like so: `[website] Title`. Examples:

```
[docs] Fix typo in xxx
[runtime] Add support for SDK 40
[sdk] Add test-case for custom transports
[snackager] Improve logging for git imports
[website] Update loading icon
```

## 🔎 Before Submitting a PR

To help keep CI green, please make sure of the following:

- Run `yarn lint --fix` to fix the formatting of the code. Ensure that `yarn lint` succeeds without errors or warnings.
- Run `yarn test` to ensure all existing tests pass for that package, along with any new tests you would've written.
- Run `yarn build` to ensure the build runs correctly and without errors or warnings.
- Run `yarn doc` to update any auto-generated docs (when applicable). Commit any changed docs.
- All `console.log`s or commented out code blocks are removed! :]


## 📚 Additional Resources

Hungry for more, check out these great guides:

- [Expo JavaScript/TypeScript Style Guide](https://github.com/expo/expo/blob/master/guides/Expo%20JavaScript%20Style%20Guide.md)
- [Git and Code Reviews at Expo](https://github.com/expo/expo/blob/master/guides/Git%20and%20Code%20Reviews.md)
- [Our Open Source Standards](https://github.com/expo/expo/blob/master/guides/Our%20Open%20Source%20Standards.md)

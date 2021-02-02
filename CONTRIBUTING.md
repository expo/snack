# Contributing to Expo Snack

## 📦 Download and Setup

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device. (`git remote add upstream git@github.com:expo/snack.git` 😉)
2. Make sure you have the following packages globally installed on your system:
   - [node](https://nodejs.org/) (node 12 or higher is recommended)
   - [yarn](https://yarnpkg.com/)
   - [PM2](https://pm2.keymetrics.io/)
   - [direnv](https://direnv.net/docs/installation.html)
3. Install the Node packages (`yarn install`)
4. [chalet](https://github.com/jeansaad/chalet) is used to to run local services on the `expo.test` domain.
   - Update `~/.chalet/conf.json` to use `{ "tld": "test" }`
   - [Configure your system or browser to use the `.test` domain](https://github.com/jeansaad/chalet/blob/master/docs/README.md#system-configuration-recommended)
   - Restart or refresh your network settings to apply the chalet changes

## 🏎️ Start the Development environment

> Before starting, make sure [direnv](https://direnv.net/docs/installation.html) is installed and `direnv allow` completes successfully.

Run `yarn start` from the root to start the Snack development services.

```
┌─ Process List ──────────────────────────────────────┐┌──  exp-web-proxy Logs  ──────
│[ 2] exp-web-proxy   Mem: 217 MB  CPU:   0 %  online ││ exp-web-proxy > Listening ...
│[ 1] exp-www-proxy   Mem: 228 MB  CPU:   0 %  online ││                              
│[ 0] snack-website   Mem: 501 MB  CPU: 128 %  online ││                              
```

> Some services like the Expo API server and the Expo website are hosted elsewhere and are proxied. The proxies log all incoming requests and auto-redirect to locally running instances when possible. 

To view the website, open http://snack.expo.test or http://localhost:3011.

## ✅ Testing

Testing is done using [Jest](https://jestjs.io/https://jestjs.io/), the delightful JavaScript Testing Framework.

1. Create a test for your feature in the appropriate `src/__tests__` directory (if the file doesn't exist already, create it with the `*-test.ts` or `*-test.tsx` extension).
2. Run the test with `yarn test` and ensure it completes succesfully. Use mocks when possible to reduce dependencies on online services and to speed up the test.

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
  
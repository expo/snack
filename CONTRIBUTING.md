# Contributing to Expo Snack

## 📦 Download and Setup

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device. (`git remote add upstream git@github.com:expo/snack.git` 😉)
2. Install the Node packages (`yarn install`)
3. That's it!

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
  
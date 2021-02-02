ESLint
======

ESLint doesn't run in the browser as is. The `eslint` repo has a build script to generate a version that runs in the browser, but we cannot use additional plugins or parser.

We use a modified version with some changes to allow running it in browser with additional plugins and parsers. The repository exists here - https://github.com/satya164/eslint-browser/tree/browser-support-2 and here https://github.com/IjzerenHein/eslint-browser/tree/browser-support-4 (latest)

To build the bundle, clone the repo, run `yarn install` and then run `yarn webpack`.

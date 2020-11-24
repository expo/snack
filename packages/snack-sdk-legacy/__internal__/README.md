# Snack SDK
Internal documentation for snack-sdk.

## Building
- `yarn`.
- `gulp build`.
- (optional) `gulp watch` to watch file changes.

## Use in WWW
- Run `npm link` in `libraries/snack-sdk`.
- Run `npm link snack-sdk` in `server/www`.
- Run the www server.

## Use in snack-sdk/example
- Run `npm link` in `libraries/snack-sdk`.
- Run `npm link snack-sdk` in `libraries/snack-sdk/example`.
- `yarn start` in `libraries/snack-sdk/example`.

## Tests
`yarn test`.

## Docs
The docs are generated automatically with documentation.js.
`yarn run docs`.

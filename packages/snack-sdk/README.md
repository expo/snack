# snack-sdk

The Expo Snack SDK. Use this to create a custom web interface for https://snack.expo.dev/. 

## 📚 Documentation

- [Documentation](https://github.com/expo/snack/blob/main/docs/snack-sdk.md)
- [API Reference](https://github.com/expo/snack/blob/main/docs/snack-sdk-api/README.md)
- [Migration Guide](https://github.com/expo/snack/blob/main/docs/snack-sdk-migration.md)

## 🔎 Example

Running the example app.

```sh
yarn build
cd ./example
yarn start
```

## 👏 Contributing

Make sure that all code lints, builds, all tests pass and the docs are updated, before committing.

```sh
yarn lint
yarn build
yarn test
yarn doc
```

## Experimental compiler contract

`SnackCompiler` describes a compiler supplied by a caller: SDK support detection,
project compilation with an abort signal, and versioned platform graph output.
`selectSnackCompiler(sdkVersion, { compiler })` selects that instance only when it
supports the requested SDK. Without a compiler, or for an unsupported SDK, the
selection is `snackager`. Capability-check failures propagate rather than silently
changing backends.

This is a preparatory API for browser compilation. `SnackCompilerOptions` is not
yet part of `SnackOptions`: the `Snack` constructor and existing sessions continue
to use Snackager. Worker creation, Session execution/cancellation, artifact
validation, and runtime delivery will be integrated separately. Selection alone
does not start compilation or make network requests.

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

Pass `compiler` to the `Snack` constructor to enable compilation for supported
SDKs. Existing sessions and unsupported SDKs continue to use Snackager.

```ts
const snack = new Snack({ compiler, files, dependencies });
const state = await snack.getStateAsync();
if (state.compilation?.status === 'ready') {
  const artifact = state.compilation.artifact;
}
```

Compilation runs when files, dependencies, or the SDK version change. Metadata
changes do not trigger compilation. A newer edit or `setDisabled(true)` aborts
pending work; stale results and errors are ignored even if the compiler ignores
its abort signal. `getStateAsync()` waits for current work, including replacements.
Use `setDisabled(true)` when retiring a session; the caller owns the compiler.

`state.compilation` reports `idle`, `compiling`, `ready` (with the validated
artifact), or `error`. The artifact must match the requested SDK and graph
protocol version, contain at least one nonempty platform payload, and fit within
15 MiB when serialized as UTF-8 JSON. Errors may describe other platforms, but a
platform cannot have both a payload and an error. This validates the envelope,
not the contents of the serialized graphs. Compilation state is never saved.

**Runtime delivery is not wired yet.** Compiler sessions suppress legacy code
updates and expose artifacts locally; they do not update connected previews.
Worker creation and delivery to compatible runtimes will follow separately.
Normal Snackager sessions retain their existing delivery behavior.

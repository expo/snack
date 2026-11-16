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

Compiled artifacts are delivered only when a transport has a runtime advertising
`snack-worker-graph@1`. Legacy code updates remain suppressed for compiler sessions.
Supply `artifactStore: createSnackArtifactStore(apiURL)` to upload chunked artifacts
through the existing Snack S3 API; Snackpub then carries integrity-checked references,
while the web player can receive inline artifacts. Saves include the published
reference in `manifest.workerArtifact`, leaving editable source files unchanged.
Worker runtime implementation and editor wiring are separate stacked changes.

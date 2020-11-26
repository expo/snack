<!-- Banner Image -->

<p align="center">
  <img src="./logo.svg" width="100px" />
  <h1 align="center">
    Expo Snack
  </h1>
</p>

<p align="center">
  <a href="https://snack.expo.io">Try Expo Snack at snack.expo.io</a>
</p>

Expo Snack is an open-source platform for running React Native apps in the browser. It dynamically bundles and compiles code and runs it in the Expo Client or in a web-player. Code can be saved as "Snacks" and easily shared with others. Snacks can also be embedded to show "live" previews as used by the [React Native documentation](https://reactnative.dev/docs/getting-started).

<!--
> Requesting snacks in bug reports gives your users an easy, lightweight way to give you a minimal, complete, and verifiable example (https://stackoverflow.com/help/minimal-reproducible-example) and allows you to spend more time fixing real issues in your project rather than staring at copy pasted code or cloning someone's repository that may or may not demonstrate a real issue with your project.
-->

## 📚 Documentation

- [Embedding Snacks](./docs/embedding-snacks.md)
- [URLs and Query parameters](./docs/url-query-parameters.md)
- [Dependencies and Bundling](./docs/dependencies-bundling.md)
- [Creating custom Snack experiences with the snack-sdk](./packages/snack-sdk/README.md)
  <!--- [Getting started with snack-sdk]()
  - [API Reference]()-->
  - [Migrating from snack-sdk@2](./docs/snack-sdk-migration.md)

## 🗺 Project Layout

- [`docs`](/docs) *Documentation and guides.*
- [`packages`](/packages) *Shared packages.*
  - [`snack-sdk`](/snack-sdk) *Package for creating (custom) Snack experiences (used by [snack.expo.io](https://snack.expo.io)).*
  - [`snack-sdk-legacy`](/snack-sdk-legacy) *Legacy snack-sdk provided for completeness.*
<!--
- [`website`](/website) *The Snack website at **https://snack.expo.io**.*
- [`snackager`](/snackager) *The Snack package bundler at **https://snackager.expo.io**.*
- [`runtime`](/runtime) *The Snack runtime app and web-player.*
-->

<!--
## 👏 Contributing

Want to contribute? Report an issue? Read the [contributing guide](./docs/contributing.md) to get started.
-->

## License

The Expo source code is made available under the [MIT license](LICENSE). Some of the dependencies are licensed differently, with the BSD license, for example.
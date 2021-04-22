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

- [Contributing to Snack](./CONTRIBUTING.md)
- [Embedding Snacks](./docs/embedding-snacks.md)
- [URLs and Query parameters](./docs/url-query-parameters.md)
- [Dependencies and Bundling](./docs/dependencies-bundling.md)
- [Snack SDK](./packages/snack-sdk) *- Creating custom Snack experiences*
  - [Documentation](./docs/snack-sdk.md)
  - [API Reference](./docs/snack-sdk-api/README.md)
  - [Migrating from snack-sdk@2](./docs/snack-sdk-migration.md)
- [ReactEurope talk 2017](https://www.youtube.com/watch?v=U0vnAW4UNXE)

<!--
Internal documentation
- [Upgrade Snack to new Expo SDK](./docs/expo-sdk-upgrade.md)
-->

## 🗺 Project Layout

- [`docs`](/docs) *Documentation and guides.*
- [`packages`](/packages) *Shared packages.*
  - [`snack-sdk`](/packages/snack-sdk) *Package for creating (custom) Snack experiences (used by [snack.expo.io](https://snack.expo.io)).*
  - [`snack-sdk-legacy`](/packages/snack-sdk-legacy) *Legacy snack-sdk provided for completeness.*
  - [`snack-proxies`](/packages/snack-proxies) *Proxies for doing local development*
- [`website`](/website) *The web-app for **https://snack.expo.io** and for **[embedded Snacks](https://snack.expo.io/embedded).***
- [`snackager`](/snackager) *The Snack package bundler at **https://snackager.expo.io**.*

> The Snack code-base consists of many more services and apps. These will be open sourced incrementally, so stay tuned for more!

<!--
- [`runtime`](/runtime) *The Snack runtime app and web-player.*
-->

## ❓ Getting in touch

- [Issues](https://github.com/expo/snack/issues)
- [Expo forums](https://forums.expo.io/c/snack)

## 👏 Contributing

If you like Expo Snack and want to help make it better then check out our [contributing guide](./CONTRIBUTING.md)!

## License

The Expo source code is made available under the [MIT license](LICENSE). Some of the dependencies are licensed differently, with the BSD license, for example.

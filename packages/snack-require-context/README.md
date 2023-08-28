# snack-require-context

Support for `require.context` in Snack is tricky, since we have no access to any bundler when executing code from users. This package helps re-implementing this API in Snack, for both libraries (through [Snackager](../../snackager/)) and user-provided code (through [Runtime](../../runtime/)).

## Usage

This package contains code for both the [Snack Runtime](../../runtime/) and [Snackager](../../snackager/).

### Snackager

The only implementation for Snackager is the transformation of `require.context` statements to `require('<virtual-module>')`.
This is done through Babel and converts the [full `require.context` signature](https://webpack.js.org/guides/dependency-management/#context-module-api) to a path with query parameter.
Once this code is evaluated within the app, the Snack Runtime knows it's a virtual module and generates the result.

### Runtime

The `require.context` system is more integrated in the Snack Runtime.
It needs to recognize virtual module requests, generate the `require.context` result based on the current project, and create new `require.context` requests when using [Expo Router](https://docs.expo.dev/routing/introduction/).
Here are the different integration points of the `require.context` system within the Snack Runtime.

- When [Expo Router](https://docs.expo.dev/routing/introduction/) is detected in a project, the Snack-compatible entry point is rendered with a [virtual module request](https://github.com/expo/snack/blob/0e0c11c044a20bec3b24e3b6bbe71f4cb4e1e4c2/runtime/src/App.tsx#L448-L450) of the `./app` directory.
- When the requested module is a virtual module, it [generates the result of the `require.context`](https://github.com/expo/snack/blob/0e0c11c044a20bec3b24e3b6bbe71f4cb4e1e4c2/runtime/src/Modules.tsx#L140-L166) based on the files and assets within the Snack.
- When parent module of the `require.context` statement or any of the containing files or assets changes, it [reinitialzes the virtual module](https://github.com/expo/snack/blob/0e0c11c044a20bec3b24e3b6bbe71f4cb4e1e4c2/runtime/src/Modules.tsx#L847-L860).

## Contributing

This package has a few commands, mainly to build, analyze and build for publishing.

- `yarn dev` → Builds an unoptimized development build.
- `yarn build` → Builds an optimized production build.

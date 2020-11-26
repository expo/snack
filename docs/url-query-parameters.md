# URLs and Parameters

The main Snack website is hosted at [https://snack.expo.io](https://snack.expo.io) and can be loaded in embedded mode and with custom parameters.

## URLs

| Path  | Description  |
|---|---|
| [https://snack.expo.io](https://snack.expo.io) | Default Snack website. |
| [https://snack.expo.io/embedded](https://snack.expo.io/embedded) | Minimal embedded website. |
| [https://snack.expo.io/{id}](https://snack.expo.io/mYtGTbIqv) | Loads a saved Snack. |
| [https://snack.expo.io/embedded/{id}](https://snack.expo.io/embedded/mYtGTbIqv) | Loads a saved Snack using the minimal embedded website. |
| [https://snack.expo.io/embed.js](https://snack.expo.io/embedded/mYtGTbIqv) | Loads the [Embed Script](./embedding-snacks.md) for including Snack embeds in your documentation. |

## Parameters

| Parameter  | Query Example | Description  |
|---|---|---|
| `code` | `&code=console.log('hello%20world')%3B` | JavaScript code to use for the Snack. This creates a Snack with a single `App.js` file. If you want to create multi-file Snacks or load contents from external sources, use the `files` parameter. |
| `description` | `&description=My%20Awesome%20Snack` | Description of the Snack. |
| `dependencies` | `&dependencies=expo-image-picker,lodash%404` | Comma separated list of dependencies to include in the Snack. The dependency version is optional. When omitted the version that is compatible with the selected SDK version is used (similar to `expo install`). |
| `files` | `&files=...` | Files that make up the Snack. This should be a URL encoded JSON object, see [Files](#Files). Causes the `code` parameter to be ignored when specified. |
| `name` | `&name=My%20Demo` | Name of the Snack. Defaults to an auto-generated name. |
| `platform`| `&platform=web` | The default platform to preview the Snack on. Defaults to `web` which will run as soon as your users see the Snack. Valid values: `ios`, `android`, `web`, `mydevice`. |
| `preview`| `&preview=true` | Shows or hides preview pane. Defaults to `false` on embedded Snacks. Valid values: `true`, `false`. |
| `sdkVersion` | `&sdkVersion=38.0.0` |  The Expo SDK version to use. Defaults to the latest released Expo SDK version. |
| `sourceUrl` | `&sourceUrl=http://mysite.com/file.js` | Using `sourceUrl` you can host your own code for a Snack anywhere you like. Just provide a url for a publicly accessible resource to the sourceUrl attribute. When specified, causes the `code` and `files` attributes to be ignored. |
| `supportedPlatforms` | `&supportedPlatforms=ios,web` | The platforms available for previewing the Snack. Defaults to `mydevice,ios,android,web` when not specified. |
| `theme` | `&theme=dark` |  The theme to use, `light` or `dark`. When omitted uses the theme that was configured by the user (defaults to `light`). |

> All query parameters should be URL encoded, e.g. by using [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

## Files

Using the `files` parameter, it is possible to:

- create multi-file Snacks
- load code from external sources
- use the `App.tsx` file extension

The `files` parameter is JSON object which supports 3 kinds of file definitions.

```js
const files = {
  // Inlined code
  'App.tsx': {
    type: 'CODE',
    contents: 'console.log("hello world!");'
  },
  // Externally hosted code (JavaScript, Markdown, JSON)
  'data/data.json': {
    type: 'CODE',
    url: 'https://mysite/data.json'
  },
  // Externally hosted assets (images, fonts)
  'assets/image.png': {
    type: 'ASSET',
    contents: 'https://mysite/image.png'
  }
};

// URL example
const url = `https://snack.expo.io?files=${encodeURIComponent(JSON.stringify(files))}`;
```

# Including Snacks in your documentation

Snacks are a great way to show off what your library can do and let users explore how to work with it. By letting them try out your library without installing locally you can make it easier to explore your library and ensure that they have a good first impression.

## Via embed.js script

```html
<!-- Embed saved Snack -->
<div
  data-snack-id="@react-navigation/basic-scrollview-tab-v3"
  data-snack-platform="web"
  data-snack-preview="true"
  data-snack-theme="light"
  data-snack-loading="lazy"
  style="overflow:hidden;background:#fafafa;border:1px solid rgba(0,0,0,.08);border-radius:4px;height:505px;width:100%">
</div>

<!-- Embed inlined Snack -->
<div
  data-snack-code="console.log('hello%20world')%3B"
  data-snack-dependencies="expo-constants%2Clodash%404"
  data-snack-name="My%20Snack"
  data-snack-description="My%20Amazing%20Snack"
  data-snack-preview="true"
  data-snack-platform="ios"
  style="overflow:hidden;background:#fafafa;border:1px solid rgba(0,0,0,.08);border-radius:4px;height:505px;width:100%">
</div>

<!-- Load the embed.js script -->
<script async src="https://snack.expo.dev/embed.js"></script>
```

The `embed.js` script scans the DOM and populates any elements containing a `data-snack-id` or `data-snack-code` attribute with an `<iframe>` displaying an embedded Snack. Attributes that start with `data-snack-` are converted to [Parameters](./url-query-parameters.md#parameters) and can be used to provide the contents of the Snack or override defaults.

| Attribute   | Description  |
|---|---|
| `data-snack-code` | JavaScript code to use for the Snack.  |
| `data-snack-description`  | Description of the Snack. |
| `data-snack-dependencies` | Comma separated list of dependencies to include in the Snack. The dependency version is optional. When omitted the version that is compatible with the selected SDK version is used (similar to `expo install`). |
| `data-snack-id` | Id of the saved Snack. When specified, `data-snack-code` and `data-snack-dependencies` are ignored. |
| `data-snack-loading` | [iFrame loading attribute](https://web.dev/iframe-lazy-loading/). Valid values: `auto`, `lazy`, `eager`. |
| `data-snack-name` | Name of the Snack. |
| `data-snack-platform`| The default platform to preview the Snack on. Defaults to `web` which will run as soon as your users see the Snack. Valid values: `ios`, `android`, `web`, `mydevice`. |
| `data-snack-preview`| Shows or hides the preview pane. Defaults to `true` using `embed.js` Snacks. Valid values: `true`, `false`. |
| `data-snack-sdkversion` |  The Expo SDK version to use (eg. `38.0.0`). Defaults to the latest released Expo SDK version. |
| `data-snack-supportedplatforms` |  The platforms available for previewing the Snack. Defaults to `mydevice,ios,android,web` when not specified. |
| `data-snack-theme` | The theme to use, `light` or `dark`. When omitted uses the theme that was configured by the user (defaults to `light`). |

> All attribute values should be URL encoded, e.g. by using [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

## Via link

```url
https://snack.expo.dev/?platform=android&name=Hello%20World&dependencies=react-navigation%40%5E4.0.10%2Creact-navigation-tabs%40%5E2.5.6%2Creact-navigation-stack%40%5E1.10.3%2Creact-navigation-drawer%40%5E2.3.3&sourceUrl=https%3A%2F%2Freactnavigation.org%2Fexamples%2F4.x%2Fhello-react-navigation.js
```

See [URLs and Parameters](./url-query-parameters.md#parameters) for all supported query arguments.

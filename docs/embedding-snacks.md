# Including Snacks in your documentation

Snacks are a great way to show off what your library can do and let users explore how to work with it.
By letting them try out your library without installing locally you can make it easier to explore your library and ensure that they have a good first impression.

## Via embed

```html
<div
  data-snack-id="@react-navigation/basic-scrollview-tab-v3"
  data-snack-platform="web"
  data-snack-preview="true"
  data-snack-theme="light"
  style="overflow:hidden;background:#fafafa;border:1px solid rgba(0,0,0,.08);border-radius:4px;height:505px;width:100%">
</div>
<script async src="https://snack.expo.io/embed.js"></script>
```

Any elements with a `data-snack-id` or `data-snack-code` attributes will be populated with an iframe displaying the App.js file and a simulator running the snack

## Via link

```url
https://snack.expo.io/?platform=android&name=Hello%20World&dependencies=react-navigation%40%5E4.0.10%2Creact-navigation-tabs%40%5E2.5.6%2Creact-navigation-stack%40%5E1.10.3%2Creact-navigation-drawer%40%5E2.3.3&sourceUrl=https%3A%2F%2Freactnavigation.org%2Fexamples%2F4.x%2Fhello-react-navigation.js
```


## Parameters

### id:
Every snack you create is available at `https://snack.expo.io/@YOUR_USERNAME/PROJECT_NAME`
Passing `@YOUR_USERNAME/PROJECT_NAME` to `data-snack-id` of an embedded snack will display the most recently saved version of your Snack.

### code:
If your example only requires a single file of source, you can provide it as a url encoded string to the `code` attribute.

### files:
If your example uses multiple files or you want use TypeScript, then use `files` to specify a collection of files. Should be a JSON object which is url encoded. When specified, the `code` attribute is ignored.

```js
JSON.stringify({
  // Use .tsx as the main entry point
  'App.tsx': {
    type: 'CODE',
    contents: 'console.log("hello world!")'
  },
  // Import data from external sources 
  'data.json': {
    type: 'CODE',
    url: 'https://mysite/data.json'
  },
  // Include assets that are hosted elsewhere
  'assets/image.png': {
    type: 'ASSET',
    contents: 'https://mysite/image.png'
  }
});
```

### sourceUrl (**deprecated, use files instead**):
Using `sourceUrl` you can host your own code for a Snack anywhere you like. Just provide a url for a publicly accessible resource to the sourceUrl attribute. When specified, causes the `code` and `files` attributes to be ignored.

### name:
Name for your example.

### description:
Description for your example.

### dependencies:
You'll want to include dependencies in your example. Provide a comma seperated list of `MODULE_NAME@VERSION_PIN` to the dependencies attribute to install modules into your Snack.

### preview:
`true|false` Enables the device preview when set to `true`. Defaults to `false` on embedded Snacks.

### platform:
`web|ios|android|mydevice` The default platform to display your example on. Defaults to `web` which will run as soon as your users see the Snack.

### supportedPlatforms:
Array of platforms which the user can select. Defaults to `mydevice,ios,android,web` when not specified.

### sdkVersion:
Expo SDK Version to use for the Snack. Defaults to the latest available Expo SDK version.

### theme:
`light|dark` The theme to use for your example. Defaults to `light` when the theme was not customized by the user.

### loading:
`lazy|eager|auto` Sets the `loading` attribute on the iframe. Uses to the default browser behavior when omitted.

# Updating dependencies

In ordinary usage, Snack only looks for new dependencies once per hour.  If you want to use snack to test a release candidate or test your documentation with your newer release, you can force an update by sending a GET request to `https://snackager.expo.io/bundle/MODULE_NAME@VERSION_PIN?bypassCache=true`


# Using Snacks for bug reports

Requesting snacks in bug reports gives your users an easy, lightweight way to give you a minimal, complete, and verifiable example (https://stackoverflow.com/help/minimal-reproducible-example) and allows you to spend more time fixing real issues in your project rather than staring at copy pasted code or cloning someone's repository that may or may not demonstrate a real issue with your project.

You may want to include a link to snack that already includes the most recent version of your library to improve 



# Snack SDK upgrade guide



## Runtime

Upgrade the Snack runtime (managed Expo app) to the latest Expo SDK.

> The runtime is located in `universe/apps/snack` and only accessible to Expo team members.

### Upgrade dependencies and files

- Either run `expo update <version>` or upgrade the dependencies in `package.json` to match those in `bundledNativeModules.json`.
- Set `expo.sdkVersion` in `app.json` to the new version.
- Update the patched packages in `./patches`.
- Update any default project files to match the template in `expo/templates/expo-template-blank`.
- Update the files in `./web` to match the latest expo-cli defaults (`expo customize:web`).

### Verify and fix issues

- Run `yarn tsc` and `yarn lint`
- Start the web-player `expo start:web`
- Run the Snack website locally and select "localhost" in the SDK versions picker
- Verify that the logs panel does not contain any warnings
- Open the web-player full-screen and use Ctrl+I to inspect the console logs
- 

### 

## Snack SDK




## Website


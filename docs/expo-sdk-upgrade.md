# Expo SDK upgrade guide <!-- omit in toc -->



- [Add new SDK version (and ship Snack with preliminary support for the new SDK version)](#add-new-sdk-version-and-ship-snack-with-preliminary-support-for-the-new-sdk-version)
  - [runtime](#runtime)
  - [snack-sdk](#snack-sdk)
  - [website](#website)
  - [Pre-release snack-sdk](#pre-release-snack-sdk)
- [Testing](#testing)
- [Release Snack with official SDK version support](#release-snack-with-official-sdk-version-support)
  - [snack-sdk](#snack-sdk-1)
  - [website](#website-1)
  - [Release snack-sdk](#release-snack-sdk)

## Add new SDK version (and ship Snack with preliminary support for the new SDK version)

Update the Snack runtime (managed Expo app), snack-sdk and website to the latest Expo SDK. After these steps have been completed, the Snack website can be deployed and contains "preliminary" support for the new SDK.

### runtime

> The runtime is located in `universe/apps/snack` and only accessible to Expo team members.

- Either run `expo update <version>` or upgrade the dependencies in `package.json` to match those in `bundledNativeModules.json`.
- Set `expo.sdkVersion` in `app.json` to the new version.
- Update the patched packages in `./patches`.
- Update any default project files to match the template in `expo/templates/expo-template-blank`.
- Update the files in `./web` to match the latest expo-cli defaults (`expo customize:web`).
- Run `yarn tsc` and `yarn lint` and fix any errors
- Deploy the native runtime to staging using `yarn deploy:staging`
- Deploy the webplayer to staging using `yarn deploy:web:staging`
- Deploy the native runtime to production using `yarn deploy:prod` (useful for testing react-native examples agains the new runtime)
- Deploy the webplayer to production using `yarn deploy:web:prod` (useful for testing react-native examples agains the new runtime)

### snack-sdk

- Add new SDK version to `snack/packages/snack-sdk/src/sdks/types.ts`
- Update `snack/packages/snack-sdk/src/sdks/index.ts` and use the same dependency versions as used by the runtime (these are used for resolving type information)
- Update `snack/packages/snack-sdk/src/__fixtures__/bundledNativeModules.json` and add the new SDK version
- Run `yarn test` and fix any failing tests
- Update CHANGELOG.md

### website

- Add new SDK version to `snack/website/src/client/configs/sdk.tsx` (versions)
- Set the value to `false` to deploy the website with preliminary support for the new SDK (see `sdk.tsx`)
- Run `yarn test` and fix any failing tests

### Pre-release snack-sdk

To enable partners to use the new Expo SDK, snack-sdk can be released to the `next` channel. 

- Update the version in `package.json`. Ex. "3.2.1-rc.0"
- `yarn build`
- `npm deploy --tag next`

## Testing

TODO

- Start the web-player `expo start:web`
- Run the Snack website locally and select "localhost" in the SDK versions picker
- Verify that the logs panel does not contain any runtime errors or warnings
- Open the web-player full-screen and use Ctrl+I to inspect the console logs
- Once the basic example has been verified, move on to the Examples in Expo docs
- Edit `expo/docs/common/snack.ts` and set the URL to `http://snack.expo.test`
- Start the Expo documentation dev-server 
- Load various pages and open their Snack examples and select "localhost" in the Snack website
- Good examples to verify:
  - Custom fonts
  - Linear gradient
  - Audio
  - Video
- TODO react-native

## Release Snack with official SDK version support

When the new Expo Go app has been shipped, Snack should be updated to support the new Expo Go app and its supported SDK versions. This includes removing deprecated versions and setting the new **default** SDK version. A PR should be made in advance which includes the following changes, so it is ready to be merged on the day of the release.

### snack-sdk

- Remove deprecated SDK version from `snack/packages/snack-sdk/src/sdks/types.ts`
- Remove version from `snack/packages/snack-sdk/src/sdks/index.ts`
- Remove version from `snack/packages/snack-sdk/src/__fixtures__/bundledNativeModules.json`
- Update default version in `snack/packages/snack-sdk/src/defaultConfig.ts` (sdkVersion)
- Run `yarn test` and fix any failing tests
- Update CHANGELOG.md

### website

- Remove SDK version from `snack/website/src/client/configs/sdk.tsx` (versions)
- Update `DEFAULT_SDK_VERSION`.
- Update `TEST_SDK_VERSION` when needed. It's best to upgrade it the latest official version, so the tests don't require upgrading everytime.
- Run `yarn test` and fix any failing tests

### Release snack-sdk

Release an official version of the snack-sdk.

- Update the version in `package.json`. Ex. "3.2.2"
- `yarn build`
- `npm deploy`

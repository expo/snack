# Expo SDK upgrade guide <!-- omit in toc -->

> This document is intended for Expo Snack maintainers. It contains references to code and resources accessible only to Expo team members.

- [Add new SDK version (and ship Snack with preliminary support for the new SDK version)](#add-new-sdk-version-and-ship-snack-with-preliminary-support-for-the-new-sdk-version)
  - [runtime](#runtime)
  - [snack-sdk](#snack-sdk)
  - [website](#website)
- [Testing](#testing)
  - [Web](#web)
  - [iOS & Android](#ios--android)
  - [Tests](#tests)
  - [Checklist](#checklist)
- [Pre-release snack-sdk](#pre-release-snack-sdk)
- [Release Snack with official SDK version support](#release-snack-with-official-sdk-version-support)
  - [runtime](#runtime-1)
  - [snack-sdk](#snack-sdk-1)
  - [website](#website-1)
  - [Release snack-sdk](#release-snack-sdk)
- [Update appetize.io](#update-appetizeio)

## Add new SDK version (and ship Snack with preliminary support for the new SDK version)

Update the Snack runtime (managed Expo app), snack-sdk and website to the latest Expo SDK. After these steps have been completed, the Snack website can be deployed and contains "preliminary" support for the new SDK.

### runtime

> The runtime is located in `universe/apps/snack` and is only accessible to Expo team members.

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


## Testing

Testing Snack should be done for all platforms: iOS, Android and Web!

### Web

- Start the runtime web-player locally `expo start:web` (in `universe/apps/snack`)
- Run the Snack website locally and select "localhost" in the SDK versions picker
- Verify that the logs panel does not contain any runtime errors or warnings
- Open the web-player full-screen and use Ctrl+I to inspect the console logs
- Verify the basic example works and then move on to the [other tests](#tests)

### iOS & Android

- Install the new Expo Go app on your test device
- Run the Snack website locally and select the new SDK version from the SDK versions picker
- Go to "My Device" and scan the QR-code with your device
- Verify the basic example works and then move on to the [other tests](#tests)

### Tests

The Expo documentation contains excellent examples for verifying Snack. The easiest way to use these examples is to Start the Expo documentation dev-server and have it use the local Snack website.

- [Edit `expo/docs/common/snack.ts`](https://github.com/expo/expo/blob/master/docs/common/snack.ts) and set the URL to `http://snack.expo.test`
- Start the Expo [documentation dev-server](https://github.com/expo/expo/tree/master/docs#running-locally)
- In the docs, select the new SDK version or "Unversioned" (if not already selected)
- Select a page and open the Snack example using "Try this example on Snack"
- Good examples to verify:
  - Custom fonts
  - Linear gradient
  - Audio
  - Video
- This should open the Snack in your locally running Snack web-app at `http://snack.expo.test`
- Verify that the correct SDK version is selected in the bottom status-bar
- Test the Snack on Web, Android and iOS

### Checklist

- Test snack.expo.io (with no id!)
  - Open unsaved snack in app, make some changes, then hit save
- Test existing snack.expo.io/ID (https://snack.expo.io/r1Xun_7eb)
  - Open that in the app, make some changes, save, and reload
- Test existing permanent snack snack.expo.io/@username/project
  - Open that in the app, make some changes, save, and reload
- Open snack directly on phone without website open (https://expo.io/@snack/r1Xun_7eb)
- Open permanent snack directly on phone without website open (https://expo.io/@username/project)
- Open `website/snack-embed.html` to test embeds

## Pre-release snack-sdk

To enable partners to use the new Expo SDK, snack-sdk can be released to the `next` channel. 

- Update the version in `package.json`. Ex. "3.2.1-rc.0"
- `yarn build`
- `npm publish --tag next`

## Release Snack with official SDK version support

When the new Expo Go app has been shipped, Snack should be updated to support the new Expo Go app and its supported SDK versions. This includes removing deprecated versions and setting the new **default** SDK version. A PR should be made in advance which includes the following changes, so it's ready to be merged on the day of the release.

### runtime

Update the runtime to the official Expo SDK. [Follow these steps](#runtime).

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
- `npm publish`
- Update CHANGELOG.md and commit your changes

## Update appetize.io

Appetize.io is used for running the Expo Go app in the cloud, in your browser. When a new Expo Go app has been released, it should be updated in appetize.io as well.

1. Download iOS build from https://exp.host/--/api/v2/versions
  - Extract the iOS `tar.gz` file
  - Rename the extracted folder to "Exponent.app" (you should now see the Expo icon)
  - Now compress "Exponent.app" into another zip-file (this is the file that you'll need to upload)
2. Download Android APK using https://exp.host/--/api/v2/versions
  - The downloaded `.apk` file is the one that should be uploaded
3. Upload to Appetize main Queue (Use credentials from 1password - Appetize Main Queue)
  - Android is at https://appetize.io/manage/private_rjkpqzbv9e7q53dw4uukutxb4g
  - iOS is at https://appetize.io/manage/private_vy2kckqpv3wc4cccdgv1yhxppg
4. Upload to Appetize Embedded Queue (Use credentials from 1password - Appetize Embedded Queue)
  - Android is at https://appetize.io/manage/private_cg1109cch61mzkhyq7cx67qprg
  - iOS is at https://appetize.io/manage/private_wpak1hhfkbv8czpx4k48gz5664
5. Check that they are working! (Android emulator will only work from staging.snack.expo.io, not through ngrok)

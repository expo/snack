# Changelog

## Unpublished

### 🛠 Breaking changes

- Dropped Expo SDK 44 ([#360](https://github.com/expo/snack/pull/360) by [@bycedric](https://github.com/byCedric))

### 🎉 New features

- Upgrade to Expo SDK 47 ([#360](https://github.com/expo/snack/pull/360) by [@bycedric](https://github.com/byCedric))

### 🐛 Bug fixes

## 3.9.0 - 2022-08-03

### 🎉 New features

- Upgrade to Expo SDK 46 stable ([#337](https://github.com/expo/snack/pull/337) by [@bycedric](https://github.com/byCedric))
- Add versioned endpoints for modules ([#334](https://github.com/expo/snack/pull/334) by [@bycedric](https://github.com/byCedric))
- Upgrade pubnub to 7.2.0 ([#332](https://github.com/expo/snack/pull/332) by [@bycedric](https://github.com/byCedric))
- Upgrade Snack to Expo SDK 45 ([#290](https://github.com/expo/snack/pull/290) by [@danstepanov](https://github.com/danstepanov))

## 3.8.0 - 2022-04-20

### 🛠 Breaking changes

- ES2018 is required

### 🎉 New features

- Prepare snack-sdk and snack-content for SDK 44 ([#277](https://github.com/expo/snack/pull/277) by [@bycedric](https://github.com/byCedric))
- Split out code related to Snack project definitions into `snack-content` ([#251](https://github.com/expo/snack/pull/251) by [@ide](https://github.com/ide))
- Upgrade Snack to Expo SDK 44 ([#243](https://github.com/expo/snack/pull/243) by [@bycedric](https://github.com/byCedric))

## 3.7.0 — 2021-12-17

### 🎉 New features

- `SnackState` & `SnackOptions` include `snackId` and `accountSnackId` for tracking snacks, rather than only full name (id).
- `saveAsync` additionally returns `snackId` and `accountSnackId`.

## 3.6.0 — 2021-10-29

### 🛠 Breaking changes

- Remove support for SDK 39 ([#234](https://github.com/expo/snack/pull/234) by [@bycedric](https://github.com/byCedric))

### 🎉 New features

- Add support for SDK 43 ([#222](https://github.com/expo/snack/pull/222) by [@IjzerenHein](https://github.com/IjzerenHein))
- Complete support for SDK 43 stable ([#234](https://github.com/expo/snack/pull/234) by [@bycedric](https://github.com/byCedric))

### 🐛 Bug fixes

## 3.5.1 — 2021-09-16

### 🐛 Bug fixes

- Fix connected-clients not having id, name, platform and transport fields ([#212](https://github.com/expo/snack/pull/212) by [@IjzerenHein](https://github.com/IjzerenHein))

## 3.5.0 — 2021-07-09

### 🛠 Breaking changes

- Remove support for SDK 38 ([#175](https://github.com/expo/snack/pull/175) by [@bycedric](https://github.com/bycedric))

### 🎉 New features

- Add support for SDK 42 ([#174](https://github.com/expo/snack/pull/174) by [@IjzerenHein](https://github.com/IjzerenHein))
- Allow checking for deprecated modules using `getDeprecatedModule` ([#172](https://github.com/expo/snack/pull/172) by [@IjzerenHein](https://github.com/IjzerenHein))

## 3.4.1 — 2021-05-06

### 🛠 Breaking changes

- Use `exp.host` for experience URLs when no host is specified in options ([#136](https://github.com/expo/snack/pull/136) by [@IjzerenHein](https://github.com/IjzerenHein))
- Remove support for SDK 37 ([#124](https://github.com/expo/snack/pull/124) by [@bycedric](https://github.com/bycedric))

### 🎉 New features

- Add support for SDK 41 ([#124](https://github.com/expo/snack/pull/121) by [@bycedric](https://github.com/bycedric))

### 🐛 Bug fixes

- Fix dependencies with subpath not using bundledNativeModules.json ([#81](https://github.com/expo/snack/pull/81) by [@IjzerenHein](https://github.com/IjzerenHein))
- Reduce size of published NPM package

## 3.3.3 — 2021-02-05

### 🐛 Bug fixes

- Fix save corruption when providing asset files using FormData ([#77](https://github.com/expo/snack/pull/77) by [@IjzerenHein](https://github.com/IjzerenHein))
- Update expo dependency using the beta of SDK 40 ([#76](https://github.com/expo/snack/pull/76) by [@IjzerenHein](https://github.com/IjzerenHein))

## 3.3.1 — 2021-01-07

### 🐛 Bug fixes

- Fix initial dependencies object modification ([#37](https://github.com/expo/snack/pull/37) by [@IjzerenHein](https://github.com/IjzerenHein))
- Fix scoped dependency names with subpaths not recognized as valid ([#37](https://github.com/expo/snack/pull/37) by [@IjzerenHein](https://github.com/IjzerenHein))

## 3.3.0 — 2021-01-06

### 🎉 New features

- Add Web-preview support ([#17](https://github.com/expo/snack/pull/17) by [@IjzerenHein](https://github.com/IjzerenHein))

### 🐛 Bug fixes

## 3.2.0 — 2020-12-09

### 🎉 New features

- Set default version to SDK 40 ([#12](https://github.com/expo/snack/pull/12) by [@IjzerenHein](https://github.com/IjzerenHein))

### 🛠 Breaking changes

- Remove support for SDK 36([#12](https://github.com/expo/snack/pull/12) by [@IjzerenHein](https://github.com/IjzerenHein))

## 3.1.0 — 2020-12-04

### 🎉 New features

- Add `isFeatureSupported` helper function. ([#10](https://github.com/expo/snack/pull/10) by [@IjzerenHein](https://github.com/IjzerenHein))
- Add `standardizeDependencies` helper function. ([#11](https://github.com/expo/snack/pull/11) by [@IjzerenHein](https://github.com/IjzerenHein))

## 3.0.0 — 2020-12-04

- Initial release. ([#9](https://github.com/expo/snack/pull/9) by [@IjzerenHein](https://github.com/IjzerenHein))

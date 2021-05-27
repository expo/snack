# Deploying

The snack runtime is packaged as an expo app which can be published as such.
No CI actions are configured for this yet, so it needs to be done manually.

## Staging

- Login to staging: `EXPO_STAGING=1 expo login`
- Deploy runtime: `yarn deploy:staging` (used by the Expo client)
- Deploy web player: `yarn deploy:web:staging` (used by Snack web preview)
- Verify that the runtime works by opening an app from `staging.snack.expo.dev` on your Expo client.
- Verify that the web-player works by using the web-preview on `staging.snack.expo.dev`.

## Production

> Always first deploy and test on staging before deploying to production.

- Login: `expo login`
- Deploy runtime: `yarn deploy:prod` (is used by the Expo client)
- Deploy web player `yarn deploy:web:prod` (is used by Snack web preview)
- Verify that the runtime works by opening an app from `snack.expo.io` on your Expo client.
- Verify that the web-player works by using the web-preview on `snack.expo.io`.

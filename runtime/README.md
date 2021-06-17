# Snack Runtime

The Snack runtime is an Expo App that loads and runs the Snack code from https://snack.expo.io or from any other app using the [snack-sdk](../packages/snack-sdk). The Snack runtime exists in two flavours:
- A native runtime for Expo Go
- A web-player for running Snacks in the browser


## Development

To start the runtime in development mode, install the dependencies and start it as a regular Expo app.

- `cd runtime`
- `yarn install`
- `expo start`

### Web player development

Start the runtime as a web-player by using `expo start --web` or choosing `Run in web browser` after running `expo start`.

In the Snack website, select the `localhost` option from the Expo version picker at the bottom. This will cause the development web-player to load within the "Web" iframe of `http://snack.expo.test`.

### Native runtime development

Use `expo start` to start the runtime and scan the QR-code with your device.

This loads the runtime into Expo Go and displays another QR-code scanner. Now, use this QR-code scanner to load any Snack by scanning the QR-code from the `My Device` tab. This will cause the Snack to load using the development runtime. By shaking your device and choosing "Reload" you can return to the runtime QR-code scanner.


## Deployment

The runtime is auto-deployed to Staging upon mergin to main. 
To deploy to production, run the `deploy` dispatch trigger of the `RuntimeProduction` Github Action workflow.

To manually deploy or learn more about deploying, see the [Deployment guide](./__internal__/DEPLOYING.md).


## Loading states

| Visible state                    | Process state                                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Blank screen (web-only)          | The web-player has not loaded index.html or the logo image (this may indicate a slow network connection or a hosting error) |
| Snack logo (non blinking)        | The runtime is being loaded                                                                                                 |
| Snack logo (blinking)            | Runtime has loaded                                                                                                          |
| Update indicator `Connecting...` | Runtime is waiting for the snack code                                                                                       |
| Update indicator `Loading...`    | Code has been received and is being loaded for the first time                                                               |
| Update indicator `Updating...`   | New code has been received, runtime is applying updates                                                                     |

> Update indicators are only shown when the operation takes too long (after 3 seconds)

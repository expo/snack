# Snack Runtime

The Snack runtime is an Expo App that loads and runs the Snack code from https://snack.expo.io or from any other app using the [snack-sdk](../packages/snack-sdk). The Snack runtime exists in two flavours:
- A native runtime for Expo Go
- A web-player for running Snacks in the browser


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

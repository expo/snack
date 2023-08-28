// The Expo Router entry component itself exists within `runtime-shell`,
// and is provided through `config.experimental.expoRouterEntry`.

/** Expected Expo Router entry point props */
export type ExpoRouterEntryProps = {
  ctx: any;
};

/**
 * Helper method to detect entry points of Expo Router.
 */
export function isExpoRouterEntry(fileContent = '') {
  return /import.*expo-router\/entry/i.test(fileContent.trim());
}

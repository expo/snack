import { env } from 'node:process';

// Default SDK 54 (and older) runtime endpoint
import { SNACK_RUNTIME_URL_ENDPOINT as SNACK_DEFAULT_RUNTIME_URL_ENDPOINT } from 'snack-content';

// Deployed via Expo snack-experimental-runtime project
// https://github.com/expo/snack/commit/c9a1a296c4a846184333f6a3182754d78bdafd75
export const SNACK_SDK_55_CANARY_RUNTIME_ENDPOINT = 'u.expo.dev/98eba87d-6d91-4756-8699-dd512ce803d3';

export function getRuntimeEndpoint({
  experimentalRuntime = ['1', 'true'].includes(env.SNACK_CLI_EXPERIMENTAL_RUNTIME ?? ''),
}: {
  experimentalRuntime?: boolean;
}): string {
  return experimentalRuntime ? SNACK_SDK_55_CANARY_RUNTIME_ENDPOINT : SNACK_DEFAULT_RUNTIME_URL_ENDPOINT;
}

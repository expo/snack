export type RuntimeUrlInfo = {
  /** The (major) Expo SDK version that should be loaded */
  sdkVersion: number;
  /**
   * The unique Snack hash, referring to a saved Snack.
   * This value may conain `[a-zA-Z0-9-_]`, but may not start with `[-_]`.
   */
  snack?: string;
  /**
   * The Snack session or channel reference, used to communicate with the Snack Website.
   * This value may contain `[a-zA-Z0-9]`.
   */
  channel?: string;
};

export type RuntimeUrlOptions = {
  /** The protocol of the URL, e.g. `exp` for Expo Go, `https` for web (defaults to `exp`) */
  protocol?: string;
  /** The endpoint containing base domain, and optional pathname, for EAS Update (defaults to EAS Update endpoint) */
  endpoint?: string;
};

/** The default domain for every Snack URL */
export const SNACK_URL_ENDPOINT = 'u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824';
/** The default protocol for every Snack URL */
export const SNACK_URL_PROTOCOL = 'exp';

/**
 * Create a Snack URL from the provided information, that opens a Snack.
 */
export function createRuntimeUrl(options: RuntimeUrlInfo & RuntimeUrlOptions): string | null {
  // Runtime URL must have a snack or channel reference
  if (!options.snack && !options.channel) {
    return null;
  }

  const protocol = options.protocol || SNACK_URL_PROTOCOL;
  const endpoint = options.endpoint || SNACK_URL_ENDPOINT;
  const parameters = new URLSearchParams();

  // Add the EAS Update references, `platform` is added by Expo Go
  parameters.set('runtime-version', `exposdk:${options.sdkVersion}.0.0`);
  parameters.set('channel-name', 'production');

  // Add the Snack reference
  if (options.snack) parameters.set('snack', options.snack);
  if (options.channel) parameters.set('snack-channel', options.channel);

  return `${protocol}://${endpoint}?${parameters}`;
}

/**
 * Parse the Snack URL info usable information, using the unified URL format.
 */
export function parseRuntimeUrl(uri: string | URL): RuntimeUrlInfo | null {
  const url =
    typeof uri === 'string'
      ? // Force non-standard protocols to `http`, avoiding Node-related parsing issues
        new URL(uri.replace(/^[a-zA-Z]+:/, 'http:'))
      : uri;

  const snack = url.searchParams.get('snack') ?? undefined;
  const channel = url.searchParams.get('snack-channel') ?? undefined;
  const runtimeVersion = url.searchParams.get('runtime-version');
  const [, sdkVersion] = runtimeVersion?.match(/exposdk:([0-9]+)\.0\.0/) ?? [];

  // Only return the URL if required parameters are present
  if (sdkVersion && (snack || channel)) {
    return { snack, channel, sdkVersion: parseInt(sdkVersion, 10) };
  }

  return null;
}

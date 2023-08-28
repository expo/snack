/** All known domains that can host Snacks */
const SNACK_DOMAINS = [
  'http://snack.expo.dev/',
  'https://snack.expo.dev/',
  'http://exp.host/',
  'https://exp.host/',
  'exp://exp.host/',
  'exps://exp.host/',
];

const SNACK_CHANNEL_PATTERN = /(\+|\/sdk\..*-)([^?]*)\??(.*$)/;

/**
 * Try to parse and extract the channel or session ID from a Snack URL.
 * This will try to parse `<channel>` from the following formats:
 *   - `https://snack.expo.dev/@snack/SNACK_ID+<channel>`
 *   - `exp://exp.host/@snack/sdk.14.0.0-<channel>`
 */
export function extractChannelFromSnackUrl(url: string): string | null {
  const matches = url.match(SNACK_CHANNEL_PATTERN);
  return matches ? matches[2] : null;
}

/**
 * Try to parse and extract the Snack identifier from a Snack URL.
 * This will try to parse `<identifier>` from the following formats:
 *   - `https://snack.expo.dev/<identifier>+SNACK_CHANNEL`
 *   - `exp://exp.host/<identifier>-SNACK_CHANNEL`
 *
 * @TODO Refactor to use a pattern lookup on the URL's path
 */
export function extractSnackIdentifierFromSnackUrl(url: string): string | null {
  try {
    // Only extract from known Snack domains
    const domain = SNACK_DOMAINS.find((domain) => url.startsWith(domain));
    if (!domain) {
      return null;
    }

    // Remove the domain from the URL
    const pathWithoutSlash = url.substring(domain.length);

    // Return the string after `+`, or the full path if no `+` is found
    return pathWithoutSlash.includes('+') ? pathWithoutSlash.split('+')[0] : pathWithoutSlash;
  } catch {
    return null;
  }
}

/**
 * Check if the provided URL is a valid Snack URL.
 * Supported url types:
 *  - 'https://exp.host/@snack/SAVE_UUID+CHANNEL_UUID'
 *  - 'https://exp.host/@snack/sdk.14.0.0-CHANNEL_UUID'
 *  - 'https://exp.host/@snack/SAVE_UUID'
 *  - 'https://exp.host/@USERNAME/SNACK_SLUG'
 */
export function isValidSnackUrl(url: string): boolean {
  return (
    extractChannelFromSnackUrl(url) !== null || extractSnackIdentifierFromSnackUrl(url) !== null
  );
}

/**
 * Create a full Snack URL based on the snack identifier.
 * This URL can only be used through Expo Go, or the Snack Runtime.
 * The identifier can be 4 formats:
 *   - `@bycedric/my-snack`
 *   - `sdk.44.0.0-CHANNEL_UUID`
 *   - `SAVE_UUID`
 *   - `SAVE_UUID+CHANNEL_UUID`
 */
export function createSnackUrlFromSnackIdentifier(snackIdentifier: string): string {
  return snackIdentifier.startsWith('@')
    ? `https://exp.host/${snackIdentifier}`
    : `https://exp.host/@snack/${snackIdentifier}`;
}

/**
 * Create a full Snack URL based on the hash identifier.
 * This URL can only be used through Expo Go, or the Snack Runtime.
 */
export function createSnackUrlFromHashId(hashId: string): string {
  return `https://exp.host/@snack/${hashId}`;
}

/**
 * Check if the Snack URL is bound to a short-lived session.
 * This session is voided whenever the user closes the Snack website or embed.
 */
export function isEphemeralSnackUrl(url = ''): boolean {
  return extractChannelFromSnackUrl(url) !== null;
}

/**
 * Parse and extract the Snack or "experience" URL and possible test transport.
 * Note, this should only be used within Snack itself and is intended to test the socket systems.
 */
export function parseExperienceURL(
  experienceURL: string
): { channel: string; testTransport: string | null } | null {
  const matches = experienceURL.match(/(\+|\/sdk\..*-)([^?]*)\??(.*$)/);
  if (!matches) {
    return null;
  }
  const channel = matches[2];

  let testTransport = null;
  const queryItems = (matches[3] ?? '').split(/&/g);
  for (const item of queryItems) {
    if (item.startsWith('testTransport=')) {
      testTransport = item.substring(14);
      break;
    }
  }
  return {
    channel,
    testTransport,
  };
}

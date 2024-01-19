type SnackRuntimeInfo = {
  /** The unique Snack hash, referring to a saved Snack */
  snack?: string;
  /** The Snack session, or messaging channel, to use. This is used for communication through the Snack Website  */
  channel?: string;
  /** The Expo SDK (semver) version or major version for the runtime. */
  sdkVersion?: string | number;
};

/** The default endpoint for Snack Runtime EAS Updates */
export const SNACK_RUNTIME_EAS_UPDATE_HOST = 'u.expo.dev/933fd9c0-1666-11e7-afca-d980795c5824';
/** The default endpoint for Snack Runtime classic updates */
export const SNACK_RUNTIME_CLASSIC_UPDATE_HOST = 'exp.host';

/**
 * Create a URL that can be used to launch the Snack Runtime.
 * This supports both classic updates as well as the new EAS Update format.
 */
export function createSnackRuntimeUrl(info: SnackRuntimeInfo) {
  return info.sdkVersion && getMajorVersion(info.sdkVersion) >= 50
    ? createEASUpdateSnackRuntimeUrl(info)
    : createClassicUpdateSnackRuntimeUrl(info);
}

/**
 * Parse the Snack information from Snack Runtme URL.
 * This supports both classic updates as well as the new EAS Update format.
 */
export function parseSnackRuntimeUrl(url: string): SnackRuntimeInfo {
  const classic = parseClassicUpdateSnackRuntimeUrl(url);
  return Object.keys(classic).length ? classic : parseEASUpdateSnackRuntimeUrl(url);
}

/**
 * Replace the host of the Snack Runtime URL with the provided host.
 * This host value should be anything like:
 *   - `exp.host` -> `exp.test`
 *   - `u.expo.dev/<projectId>` -> `custom.host.dev`
 *
 * @internal Used for internal Snack URL transformations, avoid using this
 */
export function replaceSnackRuntimeUrlHost(
  url: string,
  host: string | { classicUpdate: string; easUpdate: string },
) {
  const isEasUpdateUrl = url.includes('u.expo.dev');
  const hostPerType =
    typeof host === 'object'
      ? host
      : {
          classicUpdate: host,
          easUpdate: host,
        };

  const targetUrl = parseUrl(url);
  const sourceUrl = isEasUpdateUrl
    ? parseUrl(`http://${hostPerType.easUpdate}`)
    : parseUrl(`http://${hostPerType.classicUpdate}`);

  targetUrl.host = sourceUrl.host;

  if (isEasUpdateUrl || sourceUrl.pathname.length > 1) {
    targetUrl.pathname = sourceUrl.pathname;
  }

  if (sourceUrl.port) {
    targetUrl.port = sourceUrl.port;
  }

  return targetUrl.toString().replace(/^http:/i, 'exp:');
}

/**
 * Get the major version of an exact semver version.
 * This will throw an error if the major version can't be resolved.
 */
function getMajorVersion(semver: string | number): number {
  if (typeof semver === 'number') {
    return semver;
  }

  const majorVersion = parseInt(semver.split('.')[0], 10);
  if (!Number.isNaN(majorVersion)) {
    return majorVersion;
  }

  throw new Error(`Cannot resolve the major version from provided "sdkVersion": ${semver}`);
}

/**
 * Parse the URL string into a URL object.
 * This sanitizes and removed non-standard protocols, and defaults to `http:`.
 */
function parseUrl(url: string) {
  return new URL(url.replace(/^[a-z]+:/i, 'http:'));
}

/**
 * Create the EAS Update URL for the Snack Runtime.
 * This URL points directly to the EAS Update server,
 * and uses query paramters to pass the Snack information.
 *   - `snack` → The unique Snack hash, referring to a saved Snack.
 *   - `snack-channel` → The Snack session or messaging channel, used to connect to the Snack Website.
 *   - `runtime-version` → The EAS Update query parameter, referring to the compatible SDK version.
 *
 * Note, this URL always points to `exp://`.
 *
 * @internal Used for internal Snack URL transformations, avoid using this
 */
export function createEASUpdateSnackRuntimeUrl(info: SnackRuntimeInfo): string {
  // The `@exponent/snack` or Snack Runtime EAS Update endpoint
  const url = new URL(`https://${SNACK_RUNTIME_EAS_UPDATE_HOST}`);
  const { snack, channel, sdkVersion } = info;

  if (snack) url.searchParams.set('snack', snack);
  if (channel) url.searchParams.set('snack-channel', channel);
  if (sdkVersion) {
    url.searchParams.set('runtime-version', `exposdk:${getMajorVersion(sdkVersion)}.0.0`);
  }

  url.searchParams.set('channel-name', 'production');

  return url.toString().replace(/^https:/, 'exp:');
}

/**
 * Parse the EAS Update URL from the Snack Runtime.
 *
 * @internal Used for internal Snack URL transformations, avoid using this
 */
export function parseEASUpdateSnackRuntimeUrl(url: string): SnackRuntimeInfo {
  const { searchParams } = parseUrl(url);
  const info: SnackRuntimeInfo = {};

  if (searchParams.has('snack')) {
    info.snack = searchParams.get('snack') ?? undefined;
  }

  if (searchParams.has('snack-channel')) {
    info.channel = searchParams.get('snack-channel') ?? undefined;
  }

  if (searchParams.has('runtime-version')) {
    info.sdkVersion = searchParams.get('runtime-version')!.replace(/^exposdk:/i, '');
  }

  return info;
}

/**
 * Create the classic updates URL for the Snack Runtime.
 * These URLs follow these patterns:
 *   - exp://exp.host/@snack/sdk.<sdkVersion>-<channel>
 *   - exp://exp.host/@snack/<snack>+<channel>
 *     > Note, this is technically not correct and won't be handled. But, it is what the old system did.
 *   - exp://exp.host/@<owner>/<snack>+<channel>
 *
 * @deprecated This classic updates URL format is being phased out
 * @internal Used for internal Snack URL transformations, avoid using this
 */
export function createClassicUpdateSnackRuntimeUrl(info: SnackRuntimeInfo): string {
  const { snack, channel, sdkVersion } = info;

  if (channel) {
    if (snack && snack.startsWith('@')) {
      return `exp://${SNACK_RUNTIME_CLASSIC_UPDATE_HOST}/${snack}+${channel}`;
    } else if (snack) {
      return `exp://${SNACK_RUNTIME_CLASSIC_UPDATE_HOST}/@snack/${snack}+${channel}`;
    }

    if (!sdkVersion) {
      throw new Error(
        'Cannot create classic updates URL with only "channel", "sdkVersion" is required',
      );
    }

    return `exp://${SNACK_RUNTIME_CLASSIC_UPDATE_HOST}/@snack/sdk.${getMajorVersion(
      sdkVersion,
    )}.0.0-${channel}`;
  }

  if (snack) {
    return `exp://${SNACK_RUNTIME_CLASSIC_UPDATE_HOST}/${
      snack.match(/.*\/.*/) ? snack : `@snack/${snack}`
    }`;
  }

  throw new Error('Cannot create classic updates URL without "channel" or "snack"');
}

/**
 * The pattern to parse classic update URL's `pathname` into usable parts.
 * @see https://regex101.com/r/SXN22B/1
 * @deprecated This classic updates URL format is being phased out
 */
const LEGACY_PATHNAME_PATTERN = /^\/(@[^/]+)\/(?:sdk.([0-9.]+)-|([^/+]+)\+)(.*)?$/i;

/**
 * Parse the classic updates URL from the Snack Runtime.
 * These URLs follow these patterns:
 *   - exp://exp.host/@<owner>/<name>+<channel>
 *   - exp://exp.host/@snack/<name>+<channel>
 *     > Note, in this case, we ignore `<name>` as we can't determine the owner.
 *   - exp://exp.host/@snack/sdk.<sdkVersion>-<channel>
 *
 * @deprecated This classic updates URL format is being phased out
 * @internal Used for internal Snack URL transformations, avoid using this
 */
export function parseClassicUpdateSnackRuntimeUrl(url: string): SnackRuntimeInfo {
  const { pathname } = parseUrl(url);
  const [, owner, sdkVersion, name, channel] = pathname.match(LEGACY_PATHNAME_PATTERN) ?? [];

  // exp://exp.host/@snack/sdk.<sdkVersion>-<channel>
  if (sdkVersion) return { sdkVersion, channel };

  // exp://exp.host/@snack/<name>+<channel>
  if (owner === '@snack') return { channel, snack: name };

  // exp://exp.host/@<owner>/<name>+<channel>
  if (owner && name) return { snack: `${owner}/${name}`, channel };

  // Default to no-info
  return {};
}

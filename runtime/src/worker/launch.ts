export type WorkerLaunch = { channel?: string; url?: string; snackId?: string; apiURL?: string };

/** The protocol marker prevents legacy Snack launches from entering the worker client. */
export function getWorkerLaunch(
  config: unknown,
  initialURL?: string | null,
  services?: { url: string; apiURL: string },
): WorkerLaunch | null {
  if (!config || typeof config !== 'object') return null;
  const { sdkVersion, extra: manifestExtra } = config as {
    sdkVersion?: unknown;
    extra?: Record<string, unknown>;
  };
  let extra = manifestExtra;
  if (initialURL) {
    const params = new URL(initialURL.replace(/^[a-zA-Z]+:/, 'https:')).searchParams;
    if (params.get('compiler') === 'worker') {
      extra = {
        ...extra,
        snackCompiler: 'snack-worker-graph@1',
        snackChannel: params.get('snack-channel') || undefined,
        snackId: params.get('snack') || undefined,
        snackpubURL: extra?.snackpubURL ?? services?.url,
        snackApiURL: extra?.snackApiURL ?? services?.apiURL,
      };
    }
  }
  if (extra?.snackCompiler !== 'snack-worker-graph@1') return null;
  if (sdkVersion !== '58.0.0') throw Error('Worker Snacks require SDK 58');
  const { snackChannel, snackpubURL, snackId, snackApiURL } = extra;
  const channel = typeof snackChannel === 'string' ? snackChannel : undefined;
  const saved = typeof snackId === 'string' ? snackId : undefined;
  if (channel && !/^[A-Za-z0-9_-]{1,100}$/.test(channel)) throw Error('Invalid Snack channel');
  if (
    saved &&
    !/^(?:[A-Za-z0-9_-]{1,100}|@[A-Za-z0-9_-]{1,100}\/[A-Za-z0-9_-]{1,100})$/.test(saved)
  )
    throw Error('Invalid saved Snack identifier');
  if (!channel && !saved) throw Error('Worker launch requires a channel or saved Snack');
  const origin = (value: unknown) => {
    if (typeof value !== 'string') throw Error('Missing worker service origin');
    const parsed = new URL(value);
    if (
      parsed.origin !== value ||
      (parsed.protocol !== 'https:' &&
        !(
          parsed.protocol === 'http:' &&
          ['127.0.0.1', 'localhost', '10.0.2.2'].includes(parsed.hostname)
        ))
    )
      throw Error('Worker services require HTTPS');
    return value;
  };
  return {
    channel,
    url: channel ? origin(snackpubURL) : undefined,
    snackId: saved,
    apiURL: saved ? origin(snackApiURL) : undefined,
  };
}

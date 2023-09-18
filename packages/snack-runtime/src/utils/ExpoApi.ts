import * as Logger from '../Logger';

export type SnackApiCode = {
  id: string;
  hashId: string;
  sdkVersion: string;
  created: string;
  previewLocation: string;
  status: string; // probably should be an enum or string literals
  username: string;
  code: Record<string, { type: 'CODE' | 'ASSET'; contents: string }>;
  dependencies: Record<string, { version: string; wantedVersion: string }>;
  manifest: {
    sdkVersion: string;
    description: string;
    dependencies: Record<string, string>;
  };
};

/**
 * Fetches a snack from the Snack API.
 * @param snackIdentifier The ID of snack, can be `@snack/<hashId>` or `@<username>/<hashId>` format.
 */
export async function fetchCodeBySnackIdentifier(
  snackIdentifier: string,
): Promise<SnackApiCode | null> {
  const snackId = snackIdentifier.startsWith('@snack/')
    ? snackIdentifier.substring('@snack/'.length)
    : snackIdentifier;
  try {
    const res = await fetch(`https://exp.host/--/api/v2/snack/${snackId}`, {
      method: 'GET',
      headers: {
        'Snack-Api-Version': '3.0.0',
      },
    });
    return await res.json();
  } catch (err) {
    Logger.error(`Failed fetch snack with identifier: ${snackId}`, err);
  }

  return null;
}

/* @flow */

import type { SDKVersion } from '../configs/sdkVersions';

type Props = {
  sdkVersion: SDKVersion,
  channel: string,
  snackId: ?string,
  host: string,
};

export default function constructExperienceURL({ sdkVersion, snackId, channel, host }: Props) {
  let hostWithoutSubdomain;
  if (host.includes('snack.expo.io')) {
    hostWithoutSubdomain = host.replace('snack.expo.io', 'exp.host');
  } else if (host.includes('next-snack.expo.io')) {
    hostWithoutSubdomain = host.replace('next-snack.expo.io', 'exp.host');
  } else {
    hostWithoutSubdomain = host;
  }

  // If we are at a saved snack and have an id, go to that experience id.
  // Otherwise tell the server to give us the blank snack experience at SDK_VERSION,
  // and append a uuid to the url so that two different users starting a new snack
  // have different ids.
  const result = snackId
    ? snackId.startsWith('@')
      ? `exp://${hostWithoutSubdomain}/${snackId}+${channel}`
      : `exp://${hostWithoutSubdomain}/@snack/${snackId}+${channel}`
    : `exp://${hostWithoutSubdomain}/@snack/sdk.${sdkVersion}-${channel}`;
  return result;
}

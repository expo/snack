import semver from 'semver';

/** Infer the SDK from the minimum version allowed by the Expo dependency. */
export function getSdkVersionFromExpoPackageVersion(version: unknown): string | null {
  if (typeof version !== 'string' || !version.trim()) {
    return null;
  }

  try {
    const minimum = semver.minVersion(version);
    return minimum ? `${minimum.major}.0.0` : null;
  } catch {
    return null;
  }
}

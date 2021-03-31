import semver from 'semver';

import { Metadata } from '../types';

type Version = {
  version: string;
  isLatest: boolean;
};

export default function findVersion(qualified: string, meta: Metadata, tag: string): Version {
  let version: string | null = null;
  let latestVersion: string | null = null;

  if (meta.versions) {
    latestVersion = meta['dist-tags'] ? meta['dist-tags'].latest : null;

    if (semver.valid(tag)) {
      // already a valid version
      version = meta.versions[tag] ? tag : null;
    } else if (tag in meta['dist-tags']) {
      // dist tag
      version = meta['dist-tags'][tag];
    } else {
      // semver range
      version = semver.maxSatisfying(Object.keys(meta.versions), tag);

      if (!version && tag === '*') {
        version = latestVersion;
      }
    }
  }

  if (!version) {
    throw new Error(`Version '${tag}' for package '${qualified}' not found`);
  }
  if (!semver.valid(version)) {
    throw new Error(
      `Invalid version '${String(version)}' for package '${qualified}' (using '${tag}')`
    );
  }

  return {
    version,
    isLatest: latestVersion === version,
  };
}

import semver from 'semver';
import {
  SDKVersion,
  SnackDependencies,
  SnackMissingDependencies,
  SnackDependencyVersions,
  isModulePreloaded,
  isValidSemver,
} from 'snack-content';
import validate from 'validate-npm-package-name';

import { Logger } from './Logger';
import { SnackError } from './types';
import { fetch, createError } from './utils';

export type DependencyResolverCallback = (
  request: {
    name: string;
    version: string;
    sdkVersion: SDKVersion;
  },
  result?: any,
  error?: SnackError
) => any;

function getKey(name: string, version: string) {
  return version ? `${name}@${version}` : name;
}

export default class DependencyResolver {
  private snackagerURL: string;
  private logger?: Logger;
  private status: { [key: string]: Promise<any> } = {};
  private callback: DependencyResolverCallback;

  constructor(options: {
    snackagerURL: string;
    logger?: Logger;
    callback: DependencyResolverCallback;
  }) {
    this.snackagerURL = options.snackagerURL;
    this.logger = options.logger;
    this.callback = options.callback;
  }

  add(name: string, version: string, sdkVersion: SDKVersion) {
    const key = getKey(name, version);
    this.status[key] = this.status[key] || this.resolve(key, name, version, sdkVersion);
    return this.status[key];
  }

  remove(name: string, version: string, _sdkVersion: string) {
    delete this.status[getKey(name, version)];
  }

  async waitForCompletion() {
    let promises = Object.values(this.status);
    while (promises.length) {
      await Promise.all(promises);
      promises = Object.values(this.status);
    }
  }

  private async resolve(
    key: string,
    name: string,
    version: string,
    sdkVersion: SDKVersion
  ): Promise<any> {
    const versionSnackager = sdkVersion >= '37.0.0' ? 'version_snackager=true&' : '';
    const url = `${this.snackagerURL}/bundle/${key}?${versionSnackager}platforms=ios,android,web`;
    this.logger?.module('Resolving dependency', key, '...');
    try {
      for (let i = 0; i < 30; i++) {
        const res = await fetch(url);
        if (!this.status[key]) {
          return;
        }
        if (res.status === 200) {
          const data = await res.json();
          if (data.pending) {
            this.logger?.module('Dependency is still being bundled', key, 'trying again shortly');
            await new Promise((resolve) => setTimeout(resolve, 5000));
            if (!this.status[key]) {
              return;
            }
          } else {
            this.logger?.module('Resolved dependency', key, data);
            delete this.status[key];
            try {
              this.callback(
                {
                  name,
                  version,
                  sdkVersion,
                },
                data
              );
              return;
            } catch (e) {
              return Promise.reject(e);
            }
          }
        } else {
          const error = await res.text();
          throw new Error(error);
        }
      }
    } catch (e) {
      const error = createError({
        message: `Failed to resolve dependency '${key}' (${e.message})`,
        fileName: key,
      });
      this.logger?.error(error);
      // TypeScript thinks we need to await this promise, but we are actually checking if there is a promise or not. TS2801
      if (!!this.status[key]) {
        delete this.status[key];
        this.callback(
          {
            name,
            version,
            sdkVersion,
          },
          undefined,
          error
        );
      }
    }
  }
}

export function getMissingDependencies(
  dependencies: SnackDependencies,
  sdkVersion: SDKVersion,
  wantedDependencyVersions?: SnackDependencyVersions
): SnackMissingDependencies {
  const result: SnackMissingDependencies = {};
  for (const name in dependencies) {
    const dep = dependencies[name];
    if (dep.peerDependencies) {
      for (const peerName in dep.peerDependencies) {
        if (!isModulePreloaded(peerName, sdkVersion, true) && !dependencies[peerName]) {
          if (!result[peerName]) {
            result[peerName] = {
              dependents: [name],
              wantedVersion:
                wantedDependencyVersions?.[peerName] ?? dep.peerDependencies[peerName] ?? '*',
            };
          } else {
            let wantedVersion: string | undefined = wantedDependencyVersions?.[peerName];
            if (!wantedVersion) {
              wantedVersion = result[peerName].wantedVersion;
              const version = dep.peerDependencies[peerName] || '*';
              // Select the highest most specific version
              if (
                wantedVersion === '*' ||
                (version === 'latest' && wantedVersion === 'latest') ||
                (version !== '*' &&
                  version !== 'latest' &&
                  (wantedVersion === 'latest' ||
                    semver.gt(semver.coerce(version)!, semver.coerce(wantedVersion!)!)))
              ) {
                wantedVersion = version;
              }
            }
            result[peerName] = {
              dependents: [...result[peerName].dependents, name],
              wantedVersion,
            };
          }
        }
      }
    }
  }
  return result;
}

export function verifyDependency(name: string, version: string): SnackError | undefined {
  let { validForOldPackages, errors } = validate(name);
  if (!validForOldPackages) {
    // Also support code inside packages such as "react-native-gesture-handler/DrawerLayout"
    const names = name.split('/');
    if (names.length >= 2 && !name.startsWith('@')) {
      const result = validate(names[0]);
      validForOldPackages = result.validForNewPackages;
      errors = result.errors;
    } else if (names.length >= 2 && name.startsWith('@')) {
      const result = validate(names[0] + '/' + names[1]);
      validForOldPackages = result.validForNewPackages;
      errors = result.errors;
    }

    if (!validForOldPackages) {
      return createError({
        message: `Invalid dependency '${name}' ${errors?.length ? `(${errors[0]})` : ''}`,
        fileName: name,
      });
    }
  }
  if (!isValidSemver(version)) {
    return createError({
      message: `Invalid dependency '${name}' (version '${version}' is not a valid semver)`,
      fileName: name,
    });
  }
  return undefined;
}

export function getPackageName(name: string): string {
  const names = name.split('/');
  if (names[0].startsWith('@') && names.length >= 2) {
    return `${names[0]}/${names[1]}`;
  } else {
    return names[0];
  }
}

import mapValues from 'lodash/mapValues';
import { isModulePreloaded, SnackFiles, SnackMissingDependencies } from 'snack-sdk';

import {
  SDKVersion,
  SnackCodeFile,
  SnackDependencies,
  Annotation,
  AnnotationAction,
} from '../types';
import type { FileDependencies } from './findDependencies';
import { getAbsolutePath } from './path';

const LOCAL_FILES = ['.js', '.ts', '.tsx', '/index.js', '/index.ts', '/index.tsx'];

export function getPackageJsonFromDependencies(dependencies: SnackDependencies): SnackCodeFile {
  return {
    type: 'CODE',
    contents: JSON.stringify(
      { dependencies: mapValues(dependencies, (dep) => dep.version) },
      null,
      2
    ),
  };
}

export function getPackageJsonDependencies(
  packageJson: SnackCodeFile,
  sdkVersion: SDKVersion
): { [name: string]: string } | undefined {
  try {
    const { dependencies: jsonDeps } = JSON.parse(packageJson.contents);
    if (typeof jsonDeps !== 'object') return undefined;
    Object.keys(jsonDeps).forEach((name) => {
      if (isModulePreloaded(name, sdkVersion, true)) {
        delete jsonDeps[name];
      }
    });
    return jsonDeps;
  } catch (e) {}
  return undefined;
}

function getPackageJsonLocation(
  name: string,
  lines: string[],
  version: boolean = false
): {
  fileName: string;
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
} {
  if (name) {
    for (let line = 1; line <= lines.length; line++) {
      const col = lines[line - 1].indexOf(`"${name}"`);
      if (col >= 0) {
        return {
          fileName: 'package.json',
          startLineNumber: line,
          endLineNumber: line,
          startColumn: col + 1 + (version ? name.length + 4 : 0),
          endColumn: lines[line - 1].length + (lines[line - 1].endsWith(',') ? 0 : 1),
        };
      }
    }
  }
  return {
    fileName: 'package.json',
    startLineNumber: 1,
    endLineNumber: lines.length,
    startColumn: 1,
    endColumn: lines[lines.length - 1].length,
  };
}

export function getDependencyAnnotations(
  packageJson: SnackCodeFile,
  dependencies: SnackDependencies,
  missingDependencies: SnackMissingDependencies,
  files: SnackFiles,
  filesDependencies: { [path: string]: FileDependencies },
  sdkVersion: SDKVersion,
  getDependencyAction: (
    name: string,
    version: string,
    dependencies: SnackDependencies,
    sdkVersion: SDKVersion
  ) => AnnotationAction
): Annotation[] {
  const lines = packageJson.contents.split('\n');
  let json: any;
  try {
    json = JSON.parse(packageJson.contents);
  } catch (e) {
    return [
      {
        message: 'Invalid JSON.',
        location: getPackageJsonLocation('', lines),
        severity: 4,
        source: 'Dependencies',
      },
    ];
  }

  // Verify that package.json passes the minimum valid requirements
  if (typeof json !== 'object' || typeof json.dependencies !== 'object') {
    return [
      {
        message: `Object 'dependencies' not found.`,
        location: getPackageJsonLocation('', lines),
        severity: 4,
        source: 'Dependencies',
      },
    ];
  }

  const annotations: Annotation[] = [];

  // Give warnings about unsupported package.json entries
  for (const key in json) {
    if (key !== 'dependencies') {
      annotations.push({
        message: `Key '${key}' is not supported.`,
        location: getPackageJsonLocation(key, lines),
        severity: 2,
        source: 'Dependencies',
      });
    }
  }

  // Add annotations for package.json
  for (const name in dependencies) {
    const { error, handle, version, wantedVersion } = dependencies[name];
    if (error) {
      annotations.push({
        message: error.message,
        location: getPackageJsonLocation(name, lines, false),
        severity: 4,
        source: 'Dependencies',
        action: getDependencyAction(name, version, dependencies, sdkVersion),
      });
    } else if (!handle && !isModulePreloaded(name, sdkVersion)) {
      annotations.push({
        message: `Resolving '${name}@${version}' ...`,
        location: getPackageJsonLocation(name, lines, false),
        severity: -1,
        source: 'Dependencies',
      });
    }
    if (wantedVersion && wantedVersion !== version) {
      annotations.push({
        message: `'${name}@${version}' is not the recommended version for SDK ${sdkVersion}.`,
        location: getPackageJsonLocation(name, lines, false),
        severity: isModulePreloaded(name, sdkVersion) ? 2 : 3,
        source: 'Dependencies',
        action: getDependencyAction(name, version, dependencies, sdkVersion),
      });
    }
  }

  // Add annotations for all missing (peer) dependencies
  for (const name in missingDependencies) {
    annotations.push({
      message: `'${missingDependencies[name].dependents.join(
        ','
      )}' requires peer-dependency '${name}'.`,
      location: getPackageJsonLocation(missingDependencies[name].dependents[0], lines, false),
      severity: isModulePreloaded(name, sdkVersion) ? 2 : 4,
      source: 'Dependencies',
      action: getDependencyAction(
        name,
        missingDependencies[name].wantedVersion!,
        dependencies,
        sdkVersion
      ),
    });
  }

  // Add annotations for all files that are missing dependencies
  for (const path in filesDependencies) {
    const fileDeps = filesDependencies[path];
    for (const name in fileDeps) {
      const fileDep = fileDeps[name];
      if (fileDep.isPackage && !isModulePreloaded(name, sdkVersion, true)) {
        const dep = dependencies[name];
        if (!dep) {
          const isPreloaded = isModulePreloaded(name, sdkVersion);
          annotations.push({
            message: `'${name}' is not defined in dependencies.`,
            location: fileDep.location,
            severity: isPreloaded ? 2 : 4,
            source: 'Dependencies',
            action: getDependencyAction(name, fileDep.version ?? '*', dependencies, sdkVersion),
          });
        }
      } else if (!fileDep.isPackage) {
        const absolutePath = getAbsolutePath(name, path);
        if (!files[absolutePath] && !LOCAL_FILES.find((suffix) => files[absolutePath + suffix])) {
          annotations.push({
            message: `Cannot find file '${name}'.`,
            location: fileDep.location,
            severity: 4,
            source: 'Dependencies',
          });
        }
      }
    }
  }

  return annotations;
}

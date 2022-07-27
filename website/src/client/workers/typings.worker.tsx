import { Store, set as setItem, get as getItem } from 'idb-keyval';
import path from 'path';

import resources from '../../../resources.json';

declare const self: DedicatedWorkerGlobalScope;
declare const ts: any;

export interface TypingsResult {
  name: string;
  version: string;
  typings: FetchOutput['paths'];
  errorMessage?: string;
}

type FetchOutput = {
  resolvedVersion?: string;
  paths: {
    [key: string]: string;
  };
};

type File = {
  name: string;
  type: string;
  path: string;
};

type FileMetadata = {
  [key: string]: File;
};

self.importScripts(resources.typescript);

const ROOT_URL = `https://cdn.jsdelivr.net/`;

const store = new Store('typescript-definitions-cache-v1');
const cache = new Map<string, Promise<string>>();

const fetchAsText = (url: string): Promise<string> => {
  const cached = cache.get(url);

  if (cached) {
    // If we have a promise cached for the URL, return it
    return cached;
  }

  const promise = fetch(url).then((response) => {
    if (response.ok) {
      // If response was successful, get the response text
      return response.text();
    }

    throw new Error(
      `Failed to fetch typings (${response.statusText || response.status}) for: ${url}`
    );
  });

  // Cache the promise for the URL for subsequent requests
  cache.set(url, promise);

  return promise;
};

// Fetch definitions published to npm from DefinitelyTyped (@types/x)
const fetchFromDefinitelyTyped = (dependency: string, _version: string, output: FetchOutput) =>
  fetchAsText(
    `${ROOT_URL}npm/@types/${dependency.replace('@', '').replace(/\//g, '__')}/index.d.ts`
  ).then((typings: string) => {
    output.paths[`node_modules/${dependency}/index.d.ts`] = typings;
  });

const getRequireStatements = (title: string, code: string) => {
  const requires: string[] = [];

  const sourceFile = ts.createSourceFile(
    title,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  ts.forEachChild(sourceFile, (node: any) => {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        requires.push(node.moduleSpecifier.text);
        break;
      case ts.SyntaxKind.ExportDeclaration:
        // For syntax 'export ... from '...'''
        if (node.moduleSpecifier) {
          requires.push(node.moduleSpecifier.text);
        }
        break;
    }
  });

  return requires;
};

const getFileMetaData = (
  dependency: string,
  version: string,
  depPath: string
): Promise<FileMetadata> =>
  fetchAsText(`https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`)
    .then((response: string) => JSON.parse(response))
    .then((response: { files: File[] }) => response.files.filter((f) => f.name.startsWith(depPath)))
    .then((files: File[]) => {
      const finalObj: FileMetadata = {};

      files.forEach((d) => {
        finalObj[d.name] = d;
      });

      return finalObj;
    });

const resolveAppropriateFileSuffixes = [
  '.d.ts',
  '.ts',
  '',
  '/index.d.ts',
  '.ios.d.ts',
  '.android.d.ts',
  '.web.d.ts',
];

const resolveAppropiateFile = (fileMetaData: FileMetadata, relativePath: string) => {
  for (const suffix of resolveAppropriateFileSuffixes) {
    if (fileMetaData[`/${relativePath}${suffix}`]) {
      return `${relativePath}${suffix}`;
    }
  }
  return relativePath;
};

const getFileTypes = (
  depUrl: string,
  dependency: string,
  depPath: string,
  output: FetchOutput,
  fileMetaData: FileMetadata
): Promise<any> => {
  const virtualPath = path.join('node_modules', dependency, depPath);

  if (output.paths[virtualPath]) {
    return Promise.resolve();
  }

  return fetchAsText(`${depUrl}/${depPath}`).then((content: string): any => {
    if (output.paths[virtualPath]) {
      return;
    }

    output.paths[virtualPath] = content;

    // Now find all require statements, so we can download those types too
    return Promise.all(
      getRequireStatements(depPath, content)
        .filter(
          // Don't add global deps
          (dep) => dep.startsWith('.')
        )
        .map((relativePath) => path.join(path.dirname(depPath), relativePath))
        .map((relativePath) => resolveAppropiateFile(fileMetaData, relativePath))
        .map((nextDepPath) => getFileTypes(depUrl, dependency, nextDepPath, output, fileMetaData))
    );
  });
};

function fetchFromMeta(dependency: string, version: string, output: FetchOutput) {
  return fetchAsText(`https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`).then(
    (response: string) => {
      const meta: { files: File[] } = JSON.parse(response);

      // Get the list of matching files in the package as a flat array
      const filterAndFlatten = (files: File[], filter: RegExp) =>
        files.reduce((paths: string[], file: File) => {
          if (filter.test(file.name)) {
            paths.push(file.name);
          }

          return paths;
        }, []);

      // Get the list of .d.ts files in the package
      let declarations = filterAndFlatten(meta.files, /\.d\.ts$/);

      if (declarations.length === 0) {
        // If no .d.ts files found, fallback to .ts files
        declarations = filterAndFlatten(meta.files, /\.ts$/);
      }

      if (declarations.length === 0) {
        throw new Error(`No inline typings found for ${dependency}@${version}`);
      }

      // Also add package.json so TypeScript can find the correct entry file
      declarations.push('/package.json');

      return Promise.all(
        declarations.map((file) =>
          fetchAsText(`${ROOT_URL}npm/${dependency}@${version}${file}`).then(
            (content: string): [string, string] => [`node_modules/${dependency}${file}`, content]
          )
        )
      ).then((items: [string, string][]) => {
        items.forEach(([key, value]) => {
          output.paths[key] = value;
        });
      });
    }
  );
}

function fetchFromTypings(dependency: string, version: string, output: FetchOutput) {
  const depUrl = `${ROOT_URL}npm/${dependency}@${version}`;

  return fetchAsText(`${depUrl}/package.json`)
    .then((response: string) => JSON.parse(response))
    .then((packageJSON: { typings?: string; types?: string; version?: string }) => {
      const types = packageJSON.typings ?? packageJSON.types;
      const resolvedVersion = packageJSON.version ?? version;
      output.resolvedVersion = resolvedVersion;

      if (types) {
        // Add package.json, since this defines where all types lie
        output.paths[`node_modules/${dependency}/package.json`] = JSON.stringify(packageJSON);

        // Get all files in the specified directory
        return getFileMetaData(
          dependency,
          resolvedVersion,
          path.join('/', path.dirname(types))
        ).then((fileMetaData: FileMetadata) => {
          const resolvedDepUrl = `${ROOT_URL}npm/${dependency}@${resolvedVersion}`;
          return getFileTypes(
            resolvedDepUrl,
            dependency,
            resolveAppropiateFile(fileMetaData, types),
            output,
            fileMetaData
          );
        });
      }

      throw new Error(`No typings field in package.json for ${dependency}@${version}`);
    });
}

function fallbackAnyType(dependency: string, version: string, output: FetchOutput) {
  output.paths[`node_modules/${dependency}/package.json`] = JSON.stringify({
    name: dependency,
    version,
    types: './index.d.ts',
  });

  output.paths[`node_modules/${dependency}/index.d.ts`] = `
    declare module "${dependency}";
  `;

  // Throw a custom error to block caching, while still passing generic any declaration.
  const error: any = new Error('Failed to load types, using fallback instead.');
  error.code = 'FALLBACK_TYPES'
  error.typings = output.paths;
  throw error;
}

async function fetchDefinitions(name: string, version: string) {
  if (!version) {
    throw new Error(`No version specified for ${name}`);
  }

  // Query cache for the defintions
  const key = `${name}@${version}`;
  try {
    const result = await getItem(key, store);
    if (result) {
      return result;
    }
  } catch (e) {
    console.error('An error occurred when getting definitions from cache', e);
  }

  // If result is empty, fetch from remote
  const output: FetchOutput = {
    paths: {},
  };

  // Try checking the types/typings entry in package.json for the declarations
  await fetchFromTypings(name, version, output)
    // Not available in package.json, try checking meta for inline .d.ts files
    .catch(() => fetchFromMeta(name, output.resolvedVersion ?? version, output))
    // Not available in package.json or inline from meta, try checking in @types/
    .catch(() => fetchFromDefinitelyTyped(name, output.resolvedVersion ?? version, output))
    // Add a fallback type when the types couldn't be loaded
    .catch(() => fallbackAnyType(name, output.resolvedVersion ?? version, output));

  if (!Object.keys(output.paths).length) {
    throw new Error(`Type definitions are empty for ${key}`);
  }

  // Store in cache
  setItem(key, output.paths, store);
  return output.paths;
}

self.addEventListener('message', (event) => {
  const { name, version } = event.data;

  fetchDefinitions(name, version).then(
    (result) =>
      self.postMessage({
        name,
        version,
        typings: result,
      } as TypingsResult),
    (error) => {
      if (error.code === 'FALLBACK_TYPES') {
        return self.postMessage({
          name,
          version,
          typings: error.typings,
          errorMessage: `
Could not fetch the types for ${name}@${version}.

If you are the library author of "${name}":
  - Check if the '@types/${name.replace('@', '').replace(/\//g, '__')}' are published.
  - Or your '${name}/package.json' includes valid 'typings' or 'types' properties.
    - And your library can be viewed through ${ROOT_URL}npm/${name}@${version}/.

Falling back to "declare module '${name}';".
          `.trim(),
        } as TypingsResult);
      }

      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }
    }
  );
});

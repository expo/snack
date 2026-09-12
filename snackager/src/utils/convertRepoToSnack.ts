import FormData from 'form-data';
import fs from 'fs';
import GitUrlParse from 'git-url-parse';
import json5 from 'json5';
import path from 'path';
import picomatch from 'picomatch';
import { Snack } from 'snack-sdk';
import util from 'util';

import { getCachedObj, cacheObj } from './cacheSnackObj';
import { clone, getLatestHash, getLatestCommitDate, getCurrentHash } from './clone';
import { getSdkVersionFromExpoPackageVersion } from './getSdkVersionFromExpoPackageVersion';
import config from '../config';
import logger from '../logger';
import { GitSnackObj, GitSnackFiles, GitSnackDependencies } from '../types';

const readFile = util.promisify(fs.readFile);

const CLONE_DIR = 'clones';

export async function getGitSnackObj(
  repo: string,
  subpath: string = '/',
  branch: string = '',
  hash: string = 'latest',
  noCache: boolean = false,
): Promise<GitSnackObj> {
  if (typeof subpath !== 'string' || subpath.split(/[\\/]/).includes('..')) {
    throw new Error('Repository subpath components must not be "..".');
  }

  let temporaryPath: string | undefined;
  let resolvedClonePath: string | undefined;
  try {
    if (hash === 'latest') {
      try {
        hash = await getLatestHash(repo, branch);
      } catch (cause) {
        throw new Error('Error getting latest hash: ' + cause.message, { cause });
      }
    } else {
      await fs.promises.mkdir(CLONE_DIR, { recursive: true });
      temporaryPath = await fs.promises.mkdtemp(path.join(CLONE_DIR, 'import-'));
      resolvedClonePath = path.join(temporaryPath, 'repository');
      try {
        await clone(repo, branch, hash, resolvedClonePath);
      } catch (cause) {
        throw new Error('Error cloning repo: ' + cause.message, { cause });
      }
      try {
        hash = await getCurrentHash(resolvedClonePath);
      } catch (cause) {
        throw new Error('Error resolving repo revision: ' + cause.message, { cause });
      }
    }

    const parsed = GitUrlParse(repo);
    const name = `${parsed.resource}/${parsed.owner}/${parsed.name}`;
    const id = `${encodeURIComponent(name)}:${encodeURIComponent(subpath)}@${encodeURIComponent(
      branch || 'master',
    )}!${hash}`;

    if (!noCache) {
      const cached = await getCachedObj(id);
      if (cached) {
        logger.info(parsed, `repository found in cache ${id}`);
        return cached;
      }
    }

    if (!temporaryPath) {
      await fs.promises.mkdir(CLONE_DIR, { recursive: true });
      temporaryPath = await fs.promises.mkdtemp(path.join(CLONE_DIR, 'import-'));
    }
    const clonePath = path.join(temporaryPath, hash);
    if (resolvedClonePath) {
      await fs.promises.rename(resolvedClonePath, clonePath);
    } else {
      logger.info(parsed, `cloning ${repo}/${branch || 'HEAD'}#${hash}`);
      try {
        await clone(repo, branch, hash, clonePath);
      } catch (cause) {
        throw new Error('Error cloning repo: ' + cause.message, { cause });
      }
    }

    let commitDate: string;
    try {
      commitDate = await getLatestCommitDate(clonePath);
    } catch (cause) {
      throw new Error('Error getting repo date: ' + cause.message, { cause });
    }

    try {
      const dirname = path.join(clonePath, subpath);
      const dependencies = await generateDepsObj(dirname);
      const snackObj: GitSnackObj = {
        files: await generateFilesObj(dirname),
        dependencies,
        sdkVersion: getSdkVersionFromExpoPackageVersion(dependencies.expo),
        date: commitDate,
      };
      if (!noCache) {
        await cacheObj(snackObj, id);
      }
      return snackObj;
    } catch (cause) {
      throw new Error('Error generating snackObj: ' + cause.message, { cause });
    }
  } finally {
    if (temporaryPath) {
      await fs.promises.rm(temporaryPath, { recursive: true, force: true }).catch((error) => {
        logger.warn({ error, temporaryPath }, 'Unable to remove imported repository');
      });
    }
  }
}

function isAsset(filePath: string): boolean {
  const codeExtensions = ['.tsx', '.ts', '.js', '.jsx', '.json', '.md'];
  const extPattern = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gim;

  const ext = filePath.match(extPattern);
  if (ext) {
    return !codeExtensions.includes(ext[0]);
  }
  return false;
}

// Walks dir to generate list of files
function getFilesFromDir(dir: string): string[] {
  const filesToReturn: string[] = [];
  function walkDir(currentPath: string): void {
    fs.readdirSync(currentPath, { withFileTypes: true }).forEach((entity) => {
      const curFile = path.join(currentPath, entity.name);
      if (entity.isFile()) {
        filesToReturn.push(curFile.replace(dir, '').replace(/^\/|\/$/g, ''));
      } else if (entity.isDirectory()) {
        walkDir(curFile);
      }
    });
  }
  walkDir(dir);
  return filesToReturn;
}

async function generateFilesObj(dirname: string): Promise<GitSnackFiles> {
  const localFiles = getFilesFromDir(dirname);
  const snackFiles: GitSnackFiles = {};
  const snack = new Snack({
    verbose: process.env.NODE_ENV === 'development',
    disabled: true,
    apiURL: config.api.url,
    snackagerURL: config.url,
  });

  const isNodeModulesFile = picomatch('**/node_modules/**');

  try {
    await Promise.all(
      localFiles.map(async (fileName) => {
        // Skip hidden files starting with `.<name>` and `package.json`
        if (fileName.startsWith('.') || fileName === 'package.json') {
          return;
        }

        const filePath = path.join(dirname, fileName);

        // Skip files larger than 10MB
        const stat = fs.statSync(filePath);
        if (stat.size > 10 * 1024 * 1024) {
          return;
        }

        // Skip node_modules files
        if (isNodeModulesFile(fileName)) {
          return;
        }

        if (isAsset(filePath)) {
          const formData = new FormData();
          formData.append('asset', fs.createReadStream(filePath), fileName);
          snackFiles[fileName] = {
            type: 'ASSET',
            // @ts-ignore Argument of type 'FormData' is not assignable to parameter of type 'File | Blob | FormData'.
            contents: await snack.uploadAssetAsync(formData),
          };
          return;
        }

        snackFiles[fileName] = {
          type: 'CODE',
          contents: await readFile(filePath, 'utf8'),
        };
      }),
    );
  } catch (error) {
    throw new Error('Error parsing files: ' + error.message, { cause: error });
  }

  return snackFiles;
}

async function generateDepsObj(dirname: string): Promise<GitSnackDependencies> {
  try {
    const json = await readFile(path.join(process.cwd(), dirname, 'package.json'), 'utf-8');
    const deps = json5.parse(json).dependencies || {};
    return deps;
  } catch (e) {
    throw new Error('Error parsing dependencies: ' + e.message, { cause: e });
  }
}

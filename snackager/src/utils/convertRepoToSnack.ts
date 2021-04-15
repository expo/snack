import { getConfig } from '@expo/config';
import spawnAsync from '@expo/spawn-async';
import FormData from 'form-data';
import fs from 'fs';
import GitUrlParse from 'git-url-parse';
import json5 from 'json5';
import path from 'path';
import { Snack } from 'snack-sdk';
import util from 'util';

import config from '../config';
import logger from '../logger';
import { GitSnackObj, GitSnackFiles, GitSnackDependencies } from '../types';
import { getCachedObj, cacheObj } from './cacheSnackObj';
import { clone, getLatestHash, getLatestCommitDate } from './clone';

const readFile = util.promisify(fs.readFile);

const CLONE_DIR = 'clones';

export async function getGitSnackObj(
  repo: string,
  subpath: string = '/',
  branch: string = '',
  hash: string = 'latest',
  noCache: boolean = false
): Promise<GitSnackObj> {
  try {
    if (hash === 'latest') {
      hash = await getLatestHash(repo, branch);
    }
  } catch (e) {
    throw new Error('Error getting latest hash: ' + e.message);
  }

  const parsed = GitUrlParse(repo);
  const name = `${parsed.resource}/${parsed.owner}/${parsed.name}`;
  const id = `${encodeURIComponent(name)}:${encodeURIComponent(subpath)}@${encodeURIComponent(
    // Fallback to the `master` branch-name, to prevent the cache from resetting
    branch || 'master'
  )}!${hash}`;
  const clonePath = path.join(CLONE_DIR, id);

  let snackObj: GitSnackObj | undefined;
  if (!noCache) {
    snackObj = await getCachedObj(id);
    if (snackObj) {
      logger.info(parsed, `repository found in cache ${id}`);
      return snackObj;
    }
  }

  logger.info(parsed, `cloning ${repo}/${branch || 'HEAD'}#${hash}`);
  try {
    await clone(repo, branch, hash, clonePath);
  } catch (e) {
    throw new Error('Error cloning repo: ' + e.message);
  }

  let commitDate;
  try {
    commitDate = await getLatestCommitDate(clonePath);
  } catch (e) {
    throw new Error('Error getting repo date: ' + e.message);
  }

  try {
    // Only care about files in the subpath
    const dirname = path.join(clonePath, subpath);
    snackObj = {
      files: await generateFilesObj(dirname),
      dependencies: await generateDepsObj(dirname),
      sdkVersion: getGitSdkVersion(dirname),
      date: commitDate,
    };

    // Speed up future clones
    if (!noCache) {
      await cacheObj(snackObj, id);
    }
  } catch (e) {
    // Cleanup after ourselves
    await spawnAsync('rm', ['-rf', clonePath]);
    throw new Error('Error generating snackObj: ' + e.message);
  }

  // Cleanup after ourselves
  await spawnAsync('rm', ['-rf', clonePath]);
  return snackObj;
}

function getGitSdkVersion(dirname: string): string {
  try {
    const config = getConfig(path.join(process.cwd(), dirname));
    return config.exp.sdkVersion ?? '';
  } catch (e) {
    return '';
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

  try {
    await Promise.all(
      localFiles.map(async (fileName) => {
        // Skip hidden files starting with `.<name>` and `package.json`
        if (fileName.startsWith('.') || fileName === 'package.json') {
          return;
        }

        const filePath = path.join(dirname, fileName);

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
      })
    );
  } catch (error) {
    throw new Error('Error parsing files: ' + error.message);
  }

  return snackFiles;
}

async function generateDepsObj(dirname: string): Promise<GitSnackDependencies> {
  try {
    const json = await readFile(path.join(process.cwd(), dirname, 'package.json'), 'utf-8');
    var deps = json5.parse(json).dependencies || {};
  } catch (e) {
    throw new Error('Error parsing dependencies: ' + e.message);
  }
  return deps;
}

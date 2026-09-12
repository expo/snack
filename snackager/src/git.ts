import { Request, Response } from 'express';
import GitUrlParse from 'git-url-parse';
import querystring from 'querystring';
import {
  isModulePreloaded,
  Snack,
  getSupportedSDKVersions,
  defaultConfig,
  SDKVersion,
} from 'snack-sdk';

import config from './config';
import logger from './logger';
import { getGitSnackObj } from './utils/convertRepoToSnack';

type Config = {
  repo: string;
  subpath?: string;
  branch?: string;
  hash?: string;
  noCache?: boolean;
};

export default async function git(req: Request, res: Response): Promise<void> {
  const parsed = querystring.parse(req.url.split('?')[1] ?? '');
  let options: Config;
  try {
    const { repo, branch, hash, subpath, noCache } = parsed;
    if (typeof repo !== 'string' || !repo.startsWith('https://') || !new URL(repo).hostname) {
      throw new Error('Repository must be an HTTPS URL.');
    }
    for (const [name, value] of Object.entries({ branch, hash, subpath, noCache })) {
      if (value !== undefined && typeof value !== 'string') {
        throw new Error(`Query parameter "${name}" must be specified once.`);
      }
    }
    if (typeof subpath === 'string' && subpath.split(/[\\/]/).includes('..')) {
      throw new Error('Repository subpath components must not be "..".');
    }
    options = {
      repo,
      branch: branch as string | undefined,
      hash: hash as string | undefined,
      subpath: subpath as string | undefined,
      noCache: Boolean(noCache && noCache !== '0'),
    };
  } catch (error) {
    res.status(400);
    res.end(error instanceof TypeError ? 'Repository must be an HTTPS URL.' : error.message);
    return;
  }

  try {
    logger.info(
      parsed,
      `importing repository ${options.repo}/${options.branch}/${options.subpath}`,
    );
    const snackId = await importAsync(options);
    logger.info(parsed, `import complete, available at Snack id ${snackId}`);
    res.status(200);
    res.end(snackId);
  } catch (e) {
    res.status(500);
    res.end('Failed to create snack: ' + e.message);
  }
}

export async function importAsync(options: Config): Promise<string> {
  let { repo, subpath, branch, hash, noCache } = options;
  if (subpath && subpath !== '/') {
    // remove leading and trailing forward slashes
    subpath = subpath.replace(/^\/+|\/+$/g, '');
  }

  const {
    files,
    dependencies,
    sdkVersion: uncheckedSDKVersion,
    date,
  } = await getGitSnackObj(repo, subpath, branch, hash, noCache);

  // Verify SDK version
  let sdkVersion: SDKVersion = uncheckedSDKVersion as SDKVersion;
  if (!getSupportedSDKVersions().includes(sdkVersion)) {
    console.warn(
      `Unsupported SDK version "${sdkVersion}". Using "${defaultConfig.sdkVersion}" instead.`,
    );
    sdkVersion = defaultConfig.sdkVersion;
  }

  // Format name
  // TODO: add support for commit hash specification
  const parsed = GitUrlParse(repo);
  let name =
    parsed.protocol === 'file' ? parsed.name : `${parsed.resource}/${parsed.owner}/${parsed.name}`;
  if (subpath && subpath !== '/') {
    name += `:${subpath}`;
  }
  if (branch && branch !== 'master' && branch !== 'main') {
    name += `@${branch}`;
  }

  // Format description
  // TODO: check if we can use date-fns for better date parsing/manipulation
  const dateParts = date.split(' ');
  const monthday = dateParts.slice(1, 3).join(' ');
  const year = dateParts[4];
  const description = `${name} @ ${monthday}, ${year}`;

  // Create a disabled Snack session. This Snack does not automatically
  // resolve dependencies, nor does it query the wanted package versions.
  const snack = new Snack({
    verbose: process.env.NODE_ENV === 'development',
    disabled: true,
    apiURL: config.api.url,
    snackagerURL: config.url,
    files,
    // Filter out all preloaded dependencies and format
    dependencies: Object.fromEntries(
      Object.entries(dependencies)
        .filter(([name]) => !isModulePreloaded(name, sdkVersion, true))
        .map(([name, version]) => [name, { version }]),
    ),
    sdkVersion,
    name,
    description,
    user: { sessionSecret: process.env.GIT_SESSION_SECRET },
  });

  logger.info(options, 'saving repository');
  const { id } = await snack.saveAsync();
  return id;
}

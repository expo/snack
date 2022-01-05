import spawnAsync from '@expo/spawn-async';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';
import os from 'os';
import path from 'path';
import { SnackFiles } from 'snack-sdk';
import util from 'util';

import { importAsync } from '../git';

// TODO: replace rimraf with fs.rm once node 14.40 lands
const rimraf = util.promisify(require('rimraf'));

const SAVE_ID = '7777771777';
const ASSET_URL = 'https://myuploadedasset.com/777';

jest.setTimeout(50000);
jest.mock('node-fetch', () => {
  return jest.fn(async (url: string, options: Request) => {
    let json = {};
    if (url.endsWith('bundledNativeModules.json')) {
      json = {};
    } else if (url.endsWith('/save')) {
      // @ts-ignore Body is rewritten as json so the call scan be compared to a snapshot
      options.body = JSON.parse(options.body);
      json = { id: SAVE_ID };
    } else if (url.endsWith('/uploadAsset')) {
      json = { url: ASSET_URL };
    }
    return {
      ok: true,
      status: 200,
      json: async () => json,
    };
  });
});
// Workaround for snack-sdk's ponyfill using their own node-fetch version
jest.mock('fetch-ponyfill', () => () => ({ fetch }));

// @ts-ignore Conversion of type 'typeof fetch' to type 'Mock<any, any>' may be a mistake because neither type sufficiently overlaps with the other
const mockedFetch = fetch as jest.Mock;

beforeEach(() => {
  mockedFetch.mockClear();
});

describe('git', () => {
  it('imports basic repository', async () => {
    const repoPath = await createRepo({
      name: 'test1',
      sdkVersion: '43.0.0',
    });
    const id = await importAsync({
      repo: repoPath,
      noCache: true,
    });
    expect(id).toBe(SAVE_ID);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch.mock.calls[0]).toMatchSnapshot();
  });

  it('imports repository with no sdkVersion', async () => {
    const repoPath = await createRepo({
      name: 'test2',
      sdkVersion: undefined,
    });
    const id = await importAsync({
      repo: repoPath,
      noCache: true,
    });
    expect(id).toBe(SAVE_ID);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch.mock.calls[0]).toMatchSnapshot();
  });

  it('imports repository with too old sdkVersion', async () => {
    const repoPath = await createRepo({
      name: 'test3',
      sdkVersion: '22.0.0',
    });
    const id = await importAsync({
      repo: repoPath,
      noCache: true,
    });
    expect(id).toBe(SAVE_ID);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch.mock.calls[0]).toMatchSnapshot();
  });

  it('imports repository without app.json', async () => {
    const repoPath = await createRepo({
      name: 'some-example',
      sdkVersion: '41.0.0',
      appConfig: 'none',
    });
    const id = await importAsync({
      repo: repoPath,
      noCache: true,
    });
    expect(id).toBe(SAVE_ID);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch.mock.calls[0]).toMatchSnapshot();
  });

  it('imports repository with app.config.js', async () => {
    const repoPath = await createRepo({
      name: 'some-example',
      sdkVersion: '43.0.0',
      appConfig: 'app.config.js',
    });
    const id = await importAsync({
      repo: repoPath,
      noCache: true,
    });
    expect(id).toBe(SAVE_ID);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch.mock.calls[0]).toMatchSnapshot();
  });

  it('imports repository with assets', async () => {
    const repoPath = await createRepo({
      name: 'some-example',
      sdkVersion: '43.0.0',
      extraFiles: {
        'assets/image.png': {
          type: 'ASSET',
          contents: createAsset('image.png', 'hi'),
        },
      },
    });
    const id = await importAsync({
      repo: repoPath,
      noCache: true,
    });
    expect(id).toBe(SAVE_ID);
    expect(mockedFetch).toHaveBeenCalledTimes(2);
    expect(mockedFetch.mock.calls[0][0]).toMatchSnapshot();
    expect(mockedFetch.mock.calls[1]).toMatchSnapshot();
  });

  it('imports repository created with main branch', async () => {
    const repoPath = await createRepo({
      name: 'test1',
      sdkVersion: '43.0.0',
      branch: 'main',
    });
    const id = await importAsync({
      repo: repoPath,
      noCache: true,
    });
    expect(id).toBe(SAVE_ID);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch.mock.calls[0]).toMatchSnapshot();
  });

  it('imports repository with custom branch', async () => {
    const repoPath = await createRepo({
      name: 'test1',
      sdkVersion: '43.0.0',
      branch: 'feature-a',
    });
    const id = await importAsync({
      repo: repoPath,
      branch: 'feature-a',
      noCache: true,
    });
    expect(id).toBe(SAVE_ID);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(mockedFetch.mock.calls[0]).toMatchSnapshot();
  });

  it('fails to import repository with wrong branch', async () => {
    const repoPath = await createRepo({
      name: 'test1',
      sdkVersion: '43.0.0',
      branch: 'feature-a',
    });
    expect(
      importAsync({
        repo: repoPath,
        branch: 'feature-b',
        noCache: true,
      })
    ).rejects.toEqual(new Error(`Error cloning repo: git exited with non-zero code: 128`));
  });
});

async function createRepo(config: {
  name: string;
  sdkVersion: string | undefined;
  dependencies?: { [name: string]: string };
  appConfig?: 'app.json' | 'app.config.js' | 'none';
  extraFiles?: SnackFiles;
  branch?: string;
}): Promise<string> {
  const {
    name,
    sdkVersion,
    dependencies,
    appConfig = 'app.json',
    extraFiles = {},
    branch,
  } = config;
  const expoConfig = { name, sdkVersion };
  const files = {
    ...(appConfig === 'app.json' ? { 'app.json': JSON.stringify({ expo: expoConfig }) } : {}),
    ...(appConfig === 'app.config.js'
      ? { 'app.config.js': `export default ${JSON.stringify(expoConfig)};` }
      : {}),
    'App.js': `console.log('Hello World');`,
    ...extraFiles,
    'package.json': JSON.stringify({
      name,
      dependencies: dependencies ?? {
        'react-native': '0.62.0',
        expo: '38.0.10',
        'expo-asset': 'latest',
      },
    }),
  };

  // Create project dir with files
  const workdir = path.join(
    fs.realpathSync(os.tmpdir()),
    'snackager',
    '__integration-tests__',
    'git',
    name
  );
  try {
    await rimraf(workdir);
  } catch (e) {}
  fs.mkdirSync(workdir, { recursive: true });
  Object.keys(files).map((filename) => {
    const fullpath = path.join(workdir, filename);
    if (!fs.existsSync(path.dirname(fullpath))) {
      fs.mkdirSync(path.dirname(fullpath));
    }
    fs.writeFileSync(fullpath, files[filename]);
  });

  // Convert it into a git repository
  const commitDate = '2020-01-01T12:00:00.000Z';
  await spawnAsync('git', ['init'], { cwd: workdir });
  await spawnAsync('git', ['add', '--all'], { cwd: workdir });
  await spawnAsync('git', ['config', 'user.email', 'ci@expo.com'], { cwd: workdir });
  await spawnAsync('git', ['config', 'user.name', 'CI'], { cwd: workdir });
  await spawnAsync('git', ['add', '--all'], { cwd: workdir });
  await spawnAsync('git', ['commit', '--date', commitDate, '--message', 'Initial'], {
    cwd: workdir,
    env: {
      ...process.env,
      GIT_COMMITTER_DATE: commitDate,
    },
  });

  // Rename branch afterwards. This approach works for git versions prior to 2.28
  // https://stackoverflow.com/a/42871621
  if (branch) {
    await spawnAsync('git', ['branch', '-m', branch], { cwd: workdir });
  }

  return workdir;
}

function createAsset(name: string, contents: string): any {
  const formData = new FormData();
  formData.append('asset', contents, name);
  return formData;
}

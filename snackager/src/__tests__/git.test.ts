import git from '../git';
import { getGitSnackObj } from '../utils/convertRepoToSnack';

jest.mock('../utils/convertRepoToSnack');

beforeEach(() => jest.clearAllMocks());

it.each([
  'http://github.com/expo/snack',
  'git@github.com:expo/snack.git',
  '/tmp/repo',
  'ext::command',
  'https::github.com/expo/snack',
  'https://',
  '',
])('rejects non-HTTPS repository %s before importing', async (repo) => {
  const res = { status: jest.fn(), end: jest.fn() };
  await git({ url: `/git?${new URLSearchParams({ repo })}` } as any, res as any);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(getGitSnackObj).not.toHaveBeenCalled();
});

it('accepts an HTTPS GitHub repository', async () => {
  jest.mocked(getGitSnackObj).mockRejectedValueOnce(new Error('stop after validation'));
  const res = { status: jest.fn(), end: jest.fn() };
  const repo = 'https://github.com/expo/snack.git';
  await git({ url: `/git?${new URLSearchParams({ repo })}` } as any, res as any);
  expect(getGitSnackObj).toHaveBeenCalledWith(repo, undefined, undefined, undefined, false);
});

it.each([
  'subpath=src/../outside',
  'branch=main&branch=other',
  'hash=a&hash=b',
  'subpath=a&subpath=b',
])('rejects invalid query parameters: %s', async (query) => {
  const res = { status: jest.fn(), end: jest.fn() };
  await git({ url: `/git?repo=https://github.com/expo/snack&${query}` } as any, res as any);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(getGitSnackObj).not.toHaveBeenCalled();
});

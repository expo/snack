import spawnAsync from '@expo/spawn-async';
import path from 'path';

// Use the identity file provided by k8s in deployed environments
const isDeployed = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
const gitEnv = isDeployed
  ? {
      GIT_SSH_COMMAND: 'ssh -i /var/secrets/github/id_rsa -o "StrictHostKeyChecking no"', // eslint-disable-line
    }
  : {};

export async function clone(
  repo: string,
  branch: string | undefined,
  hash: string,
  dirname: string
): Promise<void> {
  try {
    await spawnAsync(
      'git',
      branch
        ? ['clone', '--branch', branch, repo, dirname]
        : ['clone', '--single-branch', repo, dirname],
      {
        env: { ...process.env, ...gitEnv },
      }
    );
  } catch (e) {
    throw e;
  }

  if (hash) {
    try {
      await spawnAsync('git', ['checkout', hash], {
        cwd: path.join(process.cwd(), dirname),
      });
    } catch (e) {
      // This could happen because the user provided a commit hash that is not
      // in the specified branch

      // Cleanup after ourselves
      await spawnAsync('rm', ['-rf', dirname]);
      throw new Error('Git checkout failure: ' + e.message);
    }
  }
}

export async function getLatestHash(repo: string, branch: string): Promise<string> {
  let result;
  let hash;
  try {
    result = await spawnAsync('git', ['ls-remote', repo, branch || 'HEAD'], {
      env: { ...process.env, ...gitEnv },
    });
    // Get the line
    result = result.stdout;
    // Get the hash
    hash = result.split('\t')[0];
    return hash;
  } catch (e) {
    throw new Error(
      `Failed to get latest commit hash for ${repo} ${
        branch ? `on branch ${branch} ` : ''
      }with error: ${e.message}`
    );
  }
}

export async function getLatestCommitDate(clonePath: string): Promise<string> {
  const { stdout } = await spawnAsync('git', ['log', '-1', '--format=%cd'], {
    cwd: path.join(process.cwd(), clonePath),
  });
  return stdout;
}

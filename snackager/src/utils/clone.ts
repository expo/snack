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
  dirname: string,
): Promise<void> {
  // End option parsing before the untrusted repository argument.
  try {
    await spawnAsync(
      'git',
      branch
        ? ['clone', '--branch', branch, '--', repo, dirname]
        : ['clone', '--single-branch', '--', repo, dirname],
      {
        env: { ...process.env, ...gitEnv },
      },
    );
  } catch (e) {
    throw new Error(
      'Unable to clone the repository. Check the repository URL, access permissions, and branch name.',
      { cause: e },
    );
  }

  if (hash) {
    try {
      const cwd = path.join(process.cwd(), dirname);
      // End option parsing and require a commit reference rather than a file path.
      await spawnAsync('git', ['checkout', '--detach', '--end-of-options', hash, '--'], { cwd });
    } catch (e) {
      // Cleanup must not hide the checkout error.
      await spawnAsync('rm', ['-rf', '--', dirname]).catch(() => {});
      throw new Error(
        'Unable to check out the requested revision. Use a commit, branch, or tag that exists in the repository.',
        { cause: e },
      );
    }
  }
}

export async function getLatestHash(repo: string, branch: string): Promise<string> {
  let result;
  try {
    // End option parsing before the untrusted repository argument.
    result = await spawnAsync('git', ['ls-remote', '--', repo, branch || 'HEAD'], {
      env: { ...process.env, ...gitEnv },
    });
  } catch (e) {
    throw new Error(
      'Unable to read the repository. Check the repository URL and access permissions.',
      { cause: e },
    );
  }

  if (!result.stdout.trim()) {
    throw new Error(
      'No matching commit was found. Check the branch or tag name and that the repository is not empty.',
    );
  }

  const hash = result.stdout.split('\n')[0].split('\t')[0];
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(hash)) {
    throw new Error('The repository returned an invalid commit ID.');
  }
  return hash;
}

export async function getLatestCommitDate(clonePath: string): Promise<string> {
  const { stdout } = await spawnAsync('git', ['log', '-1', '--format=%cd'], {
    cwd: path.join(process.cwd(), clonePath),
  });
  return stdout;
}

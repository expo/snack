import fs from 'fs';

export type WorkerRollout = { mode: 'off' | 'opt-in' | 'on'; artifacts: boolean };
const disabled: WorkerRollout = { mode: 'off', artifacts: false };

/** Read on every document request. Atomically replacing the file needs no server restart. */
export async function readWorkerRollout(
  env: NodeJS.ProcessEnv = process.env,
  read: (file: string) => Promise<string> = (file) => fs.promises.readFile(file, 'utf8')
): Promise<WorkerRollout> {
  try {
    let value: unknown = {
      mode: env.SNACK_WORKER_ROLLOUT || 'off',
      artifacts: env.SNACK_WORKER_PUBLISH_ARTIFACTS === '1',
    };
    if (env.SNACK_WORKER_ROLLOUT_FILE) {
      const text = await read(env.SNACK_WORKER_ROLLOUT_FILE);
      if (text.length > 4096) return { ...disabled };
      value = JSON.parse(text);
    }
    if (!value || typeof value !== 'object') return { ...disabled };
    const config = value as Partial<WorkerRollout>;
    if (
      !['off', 'opt-in', 'on'].includes(config.mode as string) ||
      typeof config.artifacts !== 'boolean'
    )
      return { ...disabled };
    return { mode: config.mode!, artifacts: config.artifacts };
  } catch {
    return { ...disabled };
  }
}

export function selectWorkerSession(
  rollout: WorkerRollout,
  requested: unknown,
  env: NodeJS.ProcessEnv = process.env
) {
  const workerCompiler =
    env.SNACK_WORKER_COMPILER === '1' &&
    (rollout.mode === 'on' || (rollout.mode === 'opt-in' && requested === 'worker'));
  return {
    workerCompiler,
    workerArtifacts: workerCompiler && rollout.artifacts && env.SNACK_WORKER_ARTIFACTS === '1',
  };
}

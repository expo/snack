import { readWorkerRollout, selectWorkerSession } from '../workerRollout';

const env = { SNACK_WORKER_COMPILER: '1', SNACK_WORKER_ARTIFACTS: '1' };
it('gates opt-in, on, off and publication independently', () => {
  expect(selectWorkerSession({ mode: 'off', artifacts: true }, 'worker', env).workerCompiler).toBe(
    false
  );
  expect(
    selectWorkerSession({ mode: 'opt-in', artifacts: true }, undefined, env).workerCompiler
  ).toBe(false);
  expect(selectWorkerSession({ mode: 'opt-in', artifacts: true }, 'worker', env)).toEqual({
    workerCompiler: true,
    workerArtifacts: true,
  });
  expect(selectWorkerSession({ mode: 'on', artifacts: false }, undefined, env)).toEqual({
    workerCompiler: true,
    workerArtifacts: false,
  });
  expect(selectWorkerSession({ mode: 'on', artifacts: true }, 'worker', {}).workerCompiler).toBe(
    false
  );
  expect(
    selectWorkerSession({ mode: 'on', artifacts: true }, undefined, { SNACK_WORKER_COMPILER: '1' })
      .workerArtifacts
  ).toBe(false);
});
it('reads changes without caching and leaves an existing session snapshot intact', async () => {
  let content = '{"mode":"on","artifacts":true}';
  const read = async () => content;
  const settings = { ...env, SNACK_WORKER_ROLLOUT_FILE: '/settings/worker.json' };
  const first = selectWorkerSession(await readWorkerRollout(settings, read), undefined, settings);
  content = '{"mode":"off","artifacts":false}';
  expect(
    selectWorkerSession(await readWorkerRollout(settings, read), 'worker', settings).workerCompiler
  ).toBe(false);
  expect(first).toEqual({ workerCompiler: true, workerArtifacts: true });
});
it('fails closed for missing or malformed configuration', async () => {
  expect(await readWorkerRollout({})).toEqual({ mode: 'off', artifacts: false });
  for (const content of [
    'invalid',
    '{}',
    '{"mode":"unknown","artifacts":true}',
    '{"mode":"on","artifacts":"yes"}',
    'x'.repeat(4097),
  ]) {
    expect(
      await readWorkerRollout({ SNACK_WORKER_ROLLOUT_FILE: 'config' }, async () => content)
    ).toEqual({ mode: 'off', artifacts: false });
  }
  expect(
    await readWorkerRollout({ SNACK_WORKER_ROLLOUT_FILE: 'config' }, async () => {
      throw Error('missing');
    })
  ).toEqual({ mode: 'off', artifacts: false });
});

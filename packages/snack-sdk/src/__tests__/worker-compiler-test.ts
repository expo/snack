import { createWorkerCompiler } from '../WorkerCompiler';

const input = {
  sdkVersion: '58.0.0' as const,
  files: {
    'App.tsx': { type: 'CODE' as const, contents: 'export default ()=>null' },
    'image.png': { type: 'ASSET' as const, contents: 'https://uploads.example/image.png' },
  },
  dependencies: { demo: { version: '1.0.0', handle: 'legacy-handle' } },
};
const client = { modules: {}, roots: {}, hash: 'test' };
it('adapts original assets, removes deleted files and keeps internal files out of source', async () => {
  const call = jest.fn(async (message: any) =>
    message.operation === 'snapshot'
      ? { snapshot: { files: { 'removed.js': 'old' } } }
      : { client, flight: 'fixture' },
  );
  const readAsset = jest.fn(async () => 'data:image/png;base64,AA==');
  const result = await createWorkerCompiler({ call, readAsset }).compile(
    input,
    new AbortController().signal,
  );
  const render = call.mock.calls.find(([request]) => request.operation === 'render')![0];
  expect(render.files['removed.js']).toBeNull();
  expect(render.files['image.png']).toBe('data:image/png;base64,AA==');
  expect(render.dependencies).toEqual({ demo: '1.0.0' });
  expect(Object.keys(input.files)).toEqual(['App.tsx', 'image.png']);
  expect(Object.keys(result.platforms)).toEqual(['web', 'ios', 'android']);
  expect(input.dependencies.demo.handle).toBe('legacy-handle');
});
it('keeps web available when a native graph is incompatible', async () => {
  const call = jest.fn(async (message: any) => {
    if (message.operation === 'snapshot') return { snapshot: { files: {} } };
    if (message.platform === 'ios') throw Error('iOS module unavailable');
    return { client, flight: 'fixture' };
  });
  const result = await createWorkerCompiler({ call, readAsset: async () => '' }).compile(
    input,
    new AbortController().signal,
  );
  expect(result.platforms.web).toBeDefined();
  expect(result.platforms.android).toBeDefined();
  expect(result.platforms.ios).toBeUndefined();
  expect(result.errors?.ios).toBe('iOS module unavailable');
});
it('does not contact the worker for canceled or reserved-path inputs', async () => {
  const call = jest.fn();
  const compiler = createWorkerCompiler({ call });
  const controller = new AbortController();
  controller.abort();
  await expect(compiler.compile(input, controller.signal)).rejects.toThrow('canceled');
  await expect(
    compiler.compile(
      { ...input, files: { '__snack_internal__/Root.tsx': input.files['App.tsx'] } },
      new AbortController().signal,
    ),
  ).rejects.toThrow('Reserved');
  expect(call).not.toHaveBeenCalled();
});
it('rejects insecure uploaded URLs before fetching them', async () => {
  const call = jest.fn();
  await expect(
    createWorkerCompiler({ call }).compile(
      {
        ...input,
        files: {
          ...input.files,
          'image.png': { type: 'ASSET', contents: 'http://uploads.example/image.png' },
        },
      },
      new AbortController().signal,
    ),
  ).rejects.toThrow('HTTPS');
  expect(call).not.toHaveBeenCalled();
});

it('reports bounded metadata without source or dependency names and tolerates a broken observer', async () => {
  const metrics: unknown[] = [];
  const compiler = createWorkerCompiler({
    call: async (message) =>
      message.operation === 'snapshot'
        ? { snapshot: { files: {} } }
        : { client, flight: 'fixture' },
    readAsset: async () => 'data:image/png;base64,AA==',
    onMetric: (metric) => {
      metrics.push(metric);
      throw Error('observer failure');
    },
  });
  await compiler.compile(input, new AbortController().signal);
  expect(metrics).toEqual([
    expect.objectContaining({
      outcome: 'success',
      fileCount: 2,
      dependencyCount: 1,
      platformCount: 3,
    }),
  ]);
  expect(JSON.stringify(metrics)).not.toContain('demo');
  expect(JSON.stringify(metrics)).not.toContain('App.tsx');
  const controller = new AbortController();
  controller.abort();
  await expect(compiler.compile(input, controller.signal)).rejects.toThrow();
  expect(metrics[1]).toEqual(expect.objectContaining({ outcome: 'canceled' }));
});

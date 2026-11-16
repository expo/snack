import Snack, {
  SnackCompiler,
  SnackCompiledArtifact,
  SnackCompilationInput,
  defaultConfig,
} from './snack-sdk';
import mockFetch from '../__mocks__/fetch-mock-server';
import Transport from '../transports/__mocks__/TestTransport';

jest.mock('../transports');
beforeEach(() => {
  Transport.instances = [];
  mockFetch.mockClear();
});
const sdkVersion = defaultConfig.sdkVersion;
const artifact: SnackCompiledArtifact = {
  format: 'snack-worker-graph',
  version: 1,
  sdkVersion,
  platforms: { web: '{"test":true}' },
};
const device = JSON.stringify({
  id: 'worker-web',
  name: 'Worker preview',
  platform: 'web',
  compilerProtocols: ['snack-worker-graph@1'],
});
const makeCompiler = (): SnackCompiler => ({
  name: 'test-worker',
  supports: (v) => v === sdkVersion,
  compile: jest.fn(async () => artifact),
});
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe('opt-in compiler', () => {
  it('delivers the compiled graph instead of legacy code and marks worker launch URLs', async () => {
    const compiler = makeCompiler();
    const snack = new Snack({
      compiler,
      online: true,
      files: { 'App.js': { type: 'CODE', contents: 'export default ()=>null' } },
      dependencies: { demo: { version: '1.0.0' } },
    });
    const transport = Transport.instances[0];
    transport.connect(device);
    await snack.getStateAsync();
    await settle();
    expect(snack.getState().compilation?.status).toBe('ready');
    expect(
      transport.publishes.find((p) => p.message.type === 'COMPILED_CODE')?.message,
    ).toMatchObject({ artifact });
    expect(transport.publishes.some((p) => p.message.type === 'CODE')).toBe(false);
    expect(
      mockFetch.mock.calls.some(([url]) => String(url).startsWith(defaultConfig.snackagerURL)),
    ).toBe(false);
    // Disconnect so save does not wait for a preview screenshot.
    transport.disconnect(device);
    await snack.saveAsync();
    expect(snack.getState().saveURL).toContain('compiler=worker');
    expect(snack.getState().url).toContain('compiler=worker');
    snack.setOnline(false);
  });
  it('publishes references over Snackpub and saves the reference with unchanged source', async () => {
    const reference = {
      format: 'snack-worker-graph' as const,
      version: 1 as const,
      sdkVersion: '58.0.0' as const,
      sha256: 'a'.repeat(64),
      byteLength: 1,
      chunks: [
        {
          url: 'https://snack-code-uploads.s3.us-west-1.amazonaws.com/~code/' + 'b'.repeat(32),
          sha256: 'a'.repeat(64),
          byteLength: 1,
        },
      ],
    };
    const compiler = {
      ...makeCompiler(),
      supports: () => true,
      compile: async (input: SnackCompilationInput) => ({
        ...artifact,
        sdkVersion: '58.0.0' as const,
        platforms: { web: String(input.files['App.js'].contents) },
      }),
    };
    const editedReference = { ...reference, sha256: 'd'.repeat(64) };
    const upload = async (value: SnackCompiledArtifact) =>
      value.platforms.web?.includes('42') ? editedReference : reference;
    const snack = new Snack({
      compiler,
      artifactStore: { upload },
      sdkVersion: '58.0.0',
      online: true,
      files: { 'App.js': { type: 'CODE', contents: 'export default ()=>null' } },
    });
    const transport = Transport.instances[0];
    transport.connect(device);
    await snack.getStateAsync();
    await settle();
    const published = transport.publishes.find((p) => p.message.type === 'COMPILED_CODE_REFERENCE');
    expect(published?.message).toMatchObject({ reference });
    expect(transport.publishes.some((p) => p.message.type === 'COMPILED_CODE')).toBe(false);
    transport.disconnect(device);
    await snack.saveAsync();
    const call = mockFetch.mock.calls
      .filter(([url]) => String(url).endsWith('/v2/snack/save'))
      .at(-1);
    const saved = JSON.parse(String(call![1].body));
    expect(saved.manifest.workerArtifact).toEqual(reference);
    snack.setCodeChangesDelay(1000);
    snack.updateFiles({ 'App.js': { type: 'CODE', contents: 'export default ()=>42' } });
    expect(snack.getState().compilation?.status).toBe('idle');
    await snack.saveAsync();
    const latestSave = mockFetch.mock.calls
      .filter(([url]) => String(url).endsWith('/v2/snack/save'))
      .at(-1);
    const latestPayload = JSON.parse(String(latestSave![1].body));
    expect(latestPayload.code).toEqual({
      'App.js': { type: 'CODE', contents: 'export default ()=>42' },
    });
    expect(latestPayload.manifest.workerArtifact).toEqual(editedReference);
    snack.setOnline(false);
  });
  it('retains legacy behavior when the compiler does not support the SDK', async () => {
    const compiler = { ...makeCompiler(), supports: () => false };
    const snack = new Snack({ compiler, online: true });
    const transport = Transport.instances[0];
    transport.connect();
    await snack.getStateAsync();
    expect(compiler.compile).not.toHaveBeenCalled();
    expect(transport.publishes[0].message.type).toBe('CODE');
    snack.setOnline(false);
  });
  it('rejects an old runtime explicitly and replays to compatible reconnects', async () => {
    const snack = new Snack({ compiler: makeCompiler(), online: true });
    const transport = Transport.instances[0];
    const old = transport.connect();
    await snack.getStateAsync();
    expect(snack.getState().connectedClients[old].status).toBe('error');
    expect(transport.publishes).toHaveLength(0);
    transport.connect(device);
    expect(transport.publishes.at(-1)?.message.type).toBe('COMPILED_CODE');
    transport.sendMessage({ type: 'RESEND_CODE' }, device);
    expect(transport.publishes.at(-1)?.message.type).toBe('COMPILED_CODE');
    snack.setOnline(false);
  });
  it('discards stale work and aborts compilation when disabled', async () => {
    const pending: { resolve: (value: SnackCompiledArtifact) => void; signal: AbortSignal }[] = [];
    const compiler = {
      ...makeCompiler(),
      compile: jest.fn(
        (_input, signal) =>
          new Promise<SnackCompiledArtifact>((resolve) => pending.push({ resolve, signal })),
      ),
    };
    const snack = new Snack({ compiler, online: true });
    const transport = Transport.instances[0];
    transport.connect(device);
    await settle();
    snack.updateFiles({ 'App.js': { type: 'CODE', contents: 'new' } });
    await settle();
    expect(pending[0].signal.aborted).toBe(true);
    pending[0].resolve(artifact);
    await settle();
    expect(transport.publishes).toHaveLength(0);
    snack.setDisabled(true);
    expect(pending[1].signal.aborted).toBe(true);
    pending[1].resolve(artifact);
    await settle();
    expect(transport.publishes).toHaveLength(0);
    snack.setOnline(false);
  });
  it('reports compiler failures and validates output before publishing', async () => {
    const compiler = {
      ...makeCompiler(),
      compile: jest.fn(async () => ({ ...artifact, version: 2 }) as any),
    };
    const snack = new Snack({ compiler, online: true });
    const transport = Transport.instances[0];
    transport.connect(device);
    await snack.getStateAsync();
    expect(snack.getState().compilation).toMatchObject({
      status: 'error',
      error: expect.objectContaining({ message: expect.stringContaining('Invalid compiled') }),
    });
    expect(transport.publishes).toHaveLength(0);
    snack.setOnline(false);
  });
});

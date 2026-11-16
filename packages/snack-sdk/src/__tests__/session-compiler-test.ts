import { newestSdkVersion, oldestSdkVersion } from 'snack-content';

import Snack, { SnackCompiler, SnackCompiledArtifact } from './snack-sdk';
import { validateCompiledArtifact } from '../Compiler';
import fetch from '../__mocks__/fetch-mock-server';
import Transport from '../transports/__mocks__/TestTransport';

jest.mock('../transports');

const artifact = (sdkVersion = newestSdkVersion): SnackCompiledArtifact => ({
  format: 'snack-worker-graph',
  version: 1,
  sdkVersion,
  platforms: { web: 'graph' },
});
const makeCompiler = (): SnackCompiler => ({
  name: 'worker',
  supports: () => true,
  compile: jest.fn(async (input) => ({
    ...artifact(input.sdkVersion),
    platforms: { web: JSON.stringify(input) },
  })),
});
const tick = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => fetch.mockClear());

it('compiles project changes without Snackager or legacy code delivery', async () => {
  const compiler = makeCompiler();
  const transport = new Transport({ name: 'test', channel: 'compiler' });
  const post = jest.spyOn(transport, 'postMessage');
  const snack = new Snack({
    compiler,
    sdkVersion: newestSdkVersion,
    transports: { test: transport },
    dependencies: { lodash: { version: '4.17.21' } },
    files: { 'App.js': { type: 'CODE', contents: 'initial' } },
    user: { sessionSecret: 'secret' },
  });
  await snack.getStateAsync();
  expect(snack.getState().compilation?.status).toBe('ready');
  expect(fetch.mock.calls.some(([url]) => String(url).includes('snackager'))).toBe(false);
  expect(post.mock.calls.some(([message]) => message.type === 'update_code')).toBe(false);
  const firstInput = (compiler.compile as jest.Mock).mock.calls[0][0];
  expect(JSON.stringify(firstInput)).not.toContain('secret');
  // A compiler cannot mutate the editor's source through the input snapshot.
  firstInput.files['App.js'].contents = 'compiler mutation';
  expect(snack.getState().files['App.js'].contents).toBe('initial');
  snack.setName('metadata only');
  await snack.getStateAsync();
  expect(compiler.compile).toHaveBeenCalledTimes(1);
  snack.updateFiles({ 'App.js': { type: 'CODE', contents: 'changed' } });
  await snack.getStateAsync();
  snack.updateDependencies({ lodash: { version: '4.17.20' } });
  await snack.getStateAsync();
  snack.setSDKVersion(oldestSdkVersion);
  await snack.getStateAsync();
  const compiled = snack.getState().compilation;
  expect(compiled?.status).toBe('ready');
  if (compiled?.status !== 'ready') throw new Error('Expected compiled project');
  expect(JSON.parse(compiled.artifact.platforms.web!)).toMatchObject({
    sdkVersion: oldestSdkVersion,
    files: { 'App.js': { type: 'CODE', contents: 'changed' } },
    dependencies: { lodash: { version: '4.17.20' } },
  });
  snack.setDisabled(true);
});

it('aborts superseded work and ignores late results from a non-cooperative compiler', async () => {
  let finish!: (value: SnackCompiledArtifact) => void;
  const compiler = makeCompiler();
  (compiler.compile as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const snack = new Snack({ compiler, sdkVersion: newestSdkVersion });
  await tick();
  const waiting = snack.getStateAsync();
  const signal = (compiler.compile as jest.Mock).mock.calls[0][1] as AbortSignal;
  snack.updateFiles({ 'App.js': { type: 'CODE', contents: 'new' } });
  await waiting;
  expect(signal.aborted).toBe(true);
  const ready = snack.getState().compilation;
  expect(ready?.status).toBe('ready');
  finish({ ...artifact(), platforms: { web: 'stale' } });
  await tick();
  expect(snack.getState().compilation).toEqual(ready);
});

it('does not compile when disabled and cancels work when disabled', async () => {
  const compiler = makeCompiler();
  const snack = new Snack({ compiler, disabled: true });
  await snack.getStateAsync();
  expect(compiler.compile).not.toHaveBeenCalled();
  (compiler.compile as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
  snack.setDisabled(false);
  await tick();
  const waiting = snack.getStateAsync();
  snack.setDisabled(true);
  await waiting;
  expect(snack.getState().compilation?.status).toBe('idle');
  snack.setDisabled(false);
  await snack.getStateAsync();
  expect(snack.getState().compilation?.status).toBe('ready');
});

it('reports rejected and invalid artifacts and recovers on a project edit', async () => {
  const compiler = makeCompiler();
  (compiler.compile as jest.Mock)
    .mockRejectedValueOnce(new Error('compile failed'))
    .mockResolvedValueOnce({ ...artifact(), version: 2 });
  const snack = new Snack({ compiler });
  await snack.getStateAsync();
  expect(snack.getState().compilation).toMatchObject({
    status: 'error',
    error: new Error('compile failed'),
  });
  snack.updateFiles({ 'App.js': { type: 'CODE', contents: 'invalid' } });
  await snack.getStateAsync();
  expect(snack.getState().compilation?.status).toBe('error');
  snack.updateFiles({ 'App.js': { type: 'CODE', contents: 'valid' } });
  await snack.getStateAsync();
  expect(snack.getState().compilation?.status).toBe('ready');
});

it('does not save compilation state or artifacts', async () => {
  const snack = new Snack({
    compiler: makeCompiler(),
    files: {
      'App.js': { type: 'CODE', contents: 'export default function App() { return null; }' },
    },
  });
  await snack.getStateAsync();
  await snack.saveAsync();
  const call = fetch.mock.calls.find(([url]) => String(url).includes('/snack/save'));
  expect(call).toBeDefined();
  const payload = JSON.parse((call![1] as unknown as RequestInit).body as string);
  expect(payload.compilation).toBeUndefined();
  expect(JSON.stringify(payload)).not.toContain('snack-worker-graph');
});

it.each([
  null,
  { ...artifact(), version: 2 },
  { ...artifact(), sdkVersion: oldestSdkVersion },
  { ...artifact(), platforms: {} },
  { ...artifact(), platforms: { windows: 'graph' } },
  { ...artifact(), platforms: { web: '' } },
  { ...artifact(), errors: { web: 'failed' } },
  { ...artifact(), platforms: { web: 'x'.repeat(15 * 1024 * 1024) } },
])('rejects malformed or oversized artifacts (%#)', (value) => {
  expect(() => validateCompiledArtifact(value, newestSdkVersion)).toThrow();
});

it('accepts partial platform success with errors for other platforms', () => {
  expect(() =>
    validateCompiledArtifact({ ...artifact(), errors: { ios: 'unsupported' } }, newestSdkVersion),
  ).not.toThrow();
});

it('resumes Snackager resolution and code delivery after leaving the compiler backend', async () => {
  const compiler = { ...makeCompiler(), supports: (sdk: string) => sdk === newestSdkVersion };
  const transport = new Transport({ name: 'test', channel: 'fallback' });
  const post = jest.spyOn(transport, 'postMessage');
  const snack = new Snack({
    compiler,
    sdkVersion: newestSdkVersion,
    transports: { test: transport },
    dependencies: { 'react-native-paper': { version: '3.10.1' } },
  });
  await snack.getStateAsync();
  expect(fetch.mock.calls.some(([url]) => String(url).includes('snackager'))).toBe(false);
  snack.setSDKVersion(oldestSdkVersion);
  await snack.getStateAsync();
  expect(snack.getState().dependencies['react-native-paper'].handle).toBeDefined();
  expect(post.mock.calls.some(([message]) => message.type === 'update_code')).toBe(true);
  snack.setDisabled(true);
});

it('ignores a stale rejection without overwriting the replacement result', async () => {
  let reject!: (error: Error) => void;
  const compiler = makeCompiler();
  (compiler.compile as jest.Mock).mockImplementationOnce(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const snack = new Snack({ compiler });
  await tick();
  snack.updateFiles({ 'App.js': { type: 'CODE', contents: 'new' } });
  await snack.getStateAsync();
  const ready = snack.getState().compilation;
  reject(new Error('old error'));
  await tick();
  expect(snack.getState().compilation).toEqual(ready);
});

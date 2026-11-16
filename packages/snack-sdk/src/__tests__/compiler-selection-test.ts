import { defaultConfig, selectSnackCompiler, SnackCompiler } from '..';

const sdkVersion = defaultConfig.sdkVersion;
const compiler: SnackCompiler = {
  name: 'test-worker',
  supports: (version) => version === sdkVersion,
  compile: async () => {
    throw new Error('Selection must not start compilation');
  },
};

it('uses Snackager unless a supplied compiler supports the SDK', () => {
  expect(selectSnackCompiler(sdkVersion)).toEqual({ backend: 'snackager' });
  expect(selectSnackCompiler('50.0.0', { compiler })).toEqual({ backend: 'snackager' });
  expect(selectSnackCompiler(sdkVersion, { compiler })).toEqual({ backend: 'compiler', compiler });
});

it('propagates capability failures instead of silently changing backends', () => {
  const error = new Error('Worker capability check failed');
  expect(() =>
    selectSnackCompiler(sdkVersion, {
      compiler: {
        ...compiler,
        supports: () => {
          throw error;
        },
      },
    }),
  ).toThrow(error);
});

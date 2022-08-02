import { getLinterConfig, defaultConfig } from '../config';

describe('defaultConfig', () => {
  it('uses bundled parser settings', () => {
    expect(defaultConfig).toHaveProperty('parser', '@babel/eslint-parser');
    expect(defaultConfig).toHaveProperty('parserOptions', expect.objectContaining({
      // All files within Snack are modules by default
      sourceType: 'module',
      // Try making parser errors more permissive
      errorRecovery: true,
      // Disable any remote config fetching, not available in standalone
      requireConfigFile: false,
      babelOptions: {
        // Disable any remote config fetching, not available in standalone
        babelrc: false,
        configFile: false,
        // Disable unnecessary AST tasks
        ast: false,
        // Sets up the parser to parse typescript, flow, js, for react native
        presets: [
          'module:metro-react-native-babel-preset',
          '@babel/preset-typescript',
        ],
      },
    }));
  });
});

describe(getLinterConfig, () => {
  it('returns default config without custom config', () => {
    expect(getLinterConfig('file.js')).toEqual(defaultConfig);
  });

  it('returns parser and parser options with custom config', () => {
    expect(getLinterConfig('file.js', { plugins: ['test'] })).toEqual({
      parser: defaultConfig.parser,
      parserOptions: defaultConfig.parserOptions,
      plugins: ['test'],
    });
  });

  it('does not overwrite parser from custom config', () => {
    expect(getLinterConfig('file.ts', { parser: 'espree' }))
      .toHaveProperty('parser', defaultConfig.parser);
  });

  it('does not overwrite parserOptions from custom config', () => {
    expect(getLinterConfig('file.ts', { parserOptions: { something: 'else' } }))
      .toHaveProperty('parserOptions', expect.objectContaining(defaultConfig.parserOptions));
  });
});

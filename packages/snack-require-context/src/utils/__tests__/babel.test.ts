import * as babel from '@babel/core';

import { snackRequireContextVirtualModuleBabelPlugin } from '../babel';

describe(snackRequireContextVirtualModuleBabelPlugin, () => {
  it(`creates virtual module for require.context('./app')`, () => {
    expect(transpile(`require.context('./app')`)).toMatchInlineSnapshot(
      `"require.context('./app');"`
    );
  });

  it(`creates virtual module for require.context('module://components')`, () => {
    expect(transpile(`require.context('module://components')`)).toMatchInlineSnapshot(
      `"require.context('module://components');"`
    );
  });

  it('creates virtual module for require.context("./app", false)', () => {
    expect(transpile(`require.context('./app', false)`)).toMatchInlineSnapshot(
      `"require.context('./app', false);"`
    );
  });

  it('creates virtual module for require.context("./app", false, /\\.mdx$/)', () => {
    expect(transpile(`require.context('./app', false, /\\.mdx$/)`)).toMatchInlineSnapshot(
      `"require.context('./app', false, /\\\\.mdx$/);"`
    );
  });

  it('creates virtual module for require.context("./app", false, /\\.mdx$/, "async")', () => {
    expect(transpile(`require.context('./app', false, /\\.mdx$/, 'async')`)).toMatchInlineSnapshot(
      `"require.context('./app', false, /\\\\.mdx$/, 'async');"`
    );
  });

  it('creates virtual module for require.context(EXPO_ROUTER_APP_ROOT)', () => {
    expect(transpile(`require.context(process.env.EXPO_ROUTER_APP_ROOT)`)).toMatchInlineSnapshot(
      `"require.context(process.env.EXPO_ROUTER_APP_ROOT);"`
    );
  });

  it('creates virtual module for require.context(EXPO_ROUTER_APP_ROOT, true, /.*/, EXPO_ROUTER_IMPORT_MODE)', () => {
    const code = `
      require.context(
        process.env.EXPO_ROUTER_APP_ROOT,
        true,
        /.*/,
        process.env.EXPO_ROUTER_IMPORT_MODE
      )
    `;

    expect(transpile(code, { EXPO_ROUTER_IMPORT_MODE: 'async' })).toMatchInlineSnapshot(
      `"require.context(process.env.EXPO_ROUTER_APP_ROOT, true, /.*/, process.env.EXPO_ROUTER_IMPORT_MODE);"`
    );
  });

  it('skips transpiling require.context() without arguments', () => {
    expect(transpile(`require.context()`)).toMatchInlineSnapshot(`"require.context();"`);
  });

  it('skips transpiling require.context(EXPO_ROUTER_APP_ROOT) when EXPO_ROUTER_APP_ROOT is empty', () => {
    const code = `require.context(process.env.EXPO_ROUTER_APP_ROOT)`;
    expect(transpile(code, { EXPO_ROUTER_APP_ROOT: '' })).toMatchInlineSnapshot(
      `"require.context(process.env.EXPO_ROUTER_APP_ROOT);"`
    );
  });

  it('skips transpiling require.context("/////////app")', () => {
    expect(transpile(`require.context('/////////app')`)).toMatchInlineSnapshot(
      `"require.context('/////////app');"`
    );
  });
});

function transpile(code: string, envVars?: Record<string, string>): string {
  const result = babel.transform(code, {
    plugins: [[snackRequireContextVirtualModuleBabelPlugin, { envVars }]],
  });

  if (!result?.code) {
    throw new Error('Could not transpile code');
  }

  return result.code;
}

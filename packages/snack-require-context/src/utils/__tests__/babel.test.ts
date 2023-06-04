import * as babel from '@babel/core';

import { snackRequireContextVirtualModuleBabelPlugin } from '../babel';

describe(snackRequireContextVirtualModuleBabelPlugin, () => {
  it(`creates virtual module for require.context('./app')`, () => {
    expect(transpile(`require.context('./app')`)).toMatchInlineSnapshot(
      `"require(\\"./app?ctx=eyJyIjp0cnVlLCJtIjoiLioiLCJvIjoic3luYyJ9\\");"`
    );
  });

  it(`creates virtual module for require.context('module://components')`, () => {
    expect(transpile(`require.context('module://components')`)).toMatchInlineSnapshot(
      `"require(\\"module://components?ctx=eyJyIjp0cnVlLCJtIjoiLioiLCJvIjoic3luYyJ9\\");"`
    );
  });

  it('creates virtual module for require.context("./app", false)', () => {
    expect(transpile(`require.context('./app', false)`)).toMatchInlineSnapshot(
      `"require(\\"./app?ctx=eyJyIjpmYWxzZSwibSI6Ii4qIiwibyI6InN5bmMifQ\\");"`
    );
  });

  it('creates virtual module for require.context("./app", false, /\\.mdx$/)', () => {
    expect(transpile(`require.context('./app', false, /\\.mdx$/)`)).toMatchInlineSnapshot(
      `"require(\\"./app?ctx=eyJyIjpmYWxzZSwibSI6IlxcLm1keCQiLCJvIjoic3luYyJ9\\");"`
    );
  });

  it('creates virtual module for require.context("./app", false, /\\.mdx$/, "async")', () => {
    expect(transpile(`require.context('./app', false, /\\.mdx$/, 'async')`)).toMatchInlineSnapshot(
      `"require(\\"./app?ctx=eyJyIjpmYWxzZSwibSI6IlxcLm1keCQiLCJvIjoiYXN5bmMifQ\\");"`
    );
  });

  it('creates virtual module for require.context(EXPO_ROUTER_APP_ROOT)', () => {
    expect(transpile(`require.context(process.env.EXPO_ROUTER_APP_ROOT)`)).toMatchInlineSnapshot(
      `"require(\\"module://app?ctx=eyJyIjp0cnVlLCJtIjoiLioiLCJvIjoic3luYyJ9\\");"`
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
      `"require(\\"module://app?ctx=eyJyIjp0cnVlLCJtIjoiLioiLCJvIjoiYXN5bmMifQ\\");"`
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

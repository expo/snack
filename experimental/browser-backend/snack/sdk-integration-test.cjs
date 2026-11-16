const assert = require('node:assert/strict'),
  esbuild = require('esbuild');
const http = require('node:http'),
  fs = require('node:fs/promises'),
  path = require('node:path');
// Only immutable compiler assets are served; save/API responses below are explicit test mocks.
const dist = path.join(__dirname, 'dist');
function createServer() {
  return http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const routes = {
      '/worker.js': 'worker.js',
      '/executor.js': 'executor.js',
      '/isolation.html': 'isolation.html',
      '/preview.html': 'preview.html',
      '/sdk-player/index.html': 'sdk-player.html',
      '/sdk-player.js': 'sdk-player.js',
    };
    const file = routes[pathname];
    if (!file) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'text/html');
      if (file === 'isolation.html' || file === 'preview.html') {
        const policies = JSON.parse(await fs.readFile(path.join(dist, 'policies.json'), 'utf8'));
        res.setHeader('Content-Security-Policy', policies[file.slice(0, -5)]);
      }
      res.end(await fs.readFile(path.join(dist, file)));
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });
}
(async () => {
  const server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  let browser;
  try {
    const origin = 'http://127.0.0.1:' + server.address().port;
    const bundle = await esbuild.build({
      entryPoints: [require.resolve('../../../packages/snack-sdk/src/index.ts')],
      bundle: true,
      platform: 'browser',
      conditions: ['browser', 'production'],
      format: 'iife',
      globalName: 'SnackSDK',
      define: { 'process.env.NODE_ENV': '"production"' },
      write: false,
    });
    browser = await require('playwright')[process.env.RSC_BROWSER || 'chromium'].launch({
      headless: true,
    });
    const page = await browser.newPage(),
      requests = [];
    page.on('request', (r) => requests.push(r.url()));
    let saved;
    await page.route(origin + '/sdk-test.js', (r) =>
      r.fulfill({ contentType: 'text/javascript', body: bundle.outputFiles[0].text }),
    );
    await page.route(origin + '/sdk-integration', (r) =>
      r.fulfill({
        contentType: 'text/html',
        body: '<script src="/sdk-test.js"></script><iframe id="player"></iframe>',
      }),
    );
    await page.route(origin + '/v2/snack/save', async (r) => {
      saved = r.request().postDataJSON();
      await r.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ id: 'saved-sdk-project' }),
      });
    });
    await page.route('https://cdn.jsdelivr.net/**', (r) =>
      r.fulfill({ contentType: 'application/json', body: '{}' }),
    );
    await page.route(origin + '/v2/versions/**', (r) =>
      r.fulfill({ contentType: 'application/json', body: '{}' }),
    );
    await page.route('https://assets.example/logo.png', (r) =>
      r.fulfill({
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
          'base64',
        ),
      }),
    );
    await page.goto(origin + '/sdk-integration');
    await page.evaluate(
      async ({ origin, backend }) => {
        const host = SnackSDK.createBrowserWorkerHost({
          baseURL: origin + '/',
          project: 'sdk-integration',
          backend,
        });
        window.compilerHost = host;
        const compiler = SnackSDK.createWorkerCompiler({ call: host.call });
        const player = document.querySelector('#player');
        window.session = new SnackSDK.Snack({
          compiler,
          sdkVersion: '58.0.0',
          apiURL: origin,
          webPlayerURL: origin + '/sdk-player',
          webPreviewRef: { current: player.contentWindow },
          files: {
            'App.tsx': {
              type: 'CODE',
              contents:
                "import React from 'react';import {Text,Pressable} from 'react-native';import clsx from 'clsx';import logo from './logo.png';export default function App(){const [n,set]=React.useState(0);return <Pressable onPress={()=>set(n+1)}><Text>{clsx('SDK integrated',n)+' '+logo.width}</Text></Pressable>}",
            },
            'logo.png': { type: 'ASSET', contents: 'https://assets.example/logo.png' },
          },
          dependencies: { clsx: { version: '2.1.1' } },
        });
        player.src = session.getState().webPreviewURL;
        await session.getStateAsync();
        if (session.getState().compilation?.error) throw session.getState().compilation.error;
      },
      { origin, backend: process.env.RSC_BACKEND || 'custom' },
    );
    const preview = page.frameLocator('#player').frameLocator('iframe');
    await preview.getByText('SDK integrated 1', { exact: true }).click();
    await preview.getByText('SDK integrated 1 1', { exact: true }).waitFor();
    await page.evaluate(async () => {
      session.reloadConnectedClients();
    });
    await preview.getByText('SDK integrated 1', { exact: true }).waitFor();
    await page.evaluate(async () => {
      session.updateFiles({
        'App.tsx': {
          type: 'CODE',
          contents:
            "import React from 'react';import {Text} from 'react-native';export default ()=> <Text>Updated through Session</Text>",
        },
      });
      await session.getStateAsync();
    });
    await preview.getByText('Updated through Session', { exact: true }).waitFor();
    await page.evaluate(async () => {
      await session.saveAsync();
    });
    assert.equal(saved.code['logo.png'].contents, 'https://assets.example/logo.png');
    assert(!Object.keys(saved.code).some((p) => p.startsWith('__snack_internal__')));
    assert.deepEqual(saved.manifest.dependencies, { clsx: '2.1.1' });
    assert(!saved.artifact);
    assert(requests.every((url) => !url.includes('snackager')));
    // The installed ordinary app keeps running after its compiler host disappears.
    await page.evaluate(() => compilerHost.dispose());
    await preview.getByText('Updated through Session', { exact: true }).waitFor();
    console.log(
      'Existing Snack Session + real worker: npm, uploaded URL asset, web-player negotiation, interaction, reload, edits, original save payload and compiler-independent rendering passed',
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

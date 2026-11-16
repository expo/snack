const path = require('node:path');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
esbuild.build({
  entryPoints: [require.resolve('react-server-dom-webpack/client.browser')],
  bundle: true, platform: 'browser', format: 'cjs', external: ['react'],
  define: { 'process.env.NODE_ENV': '"production"', '__webpack_require__': 'globalThis.__snackRequire', '__webpack_chunk_load__': 'globalThis.__snackChunk' },
  outfile: path.join(root, 'src/worker/flight-client.js'), minify: true,
}).catch(error => { console.error(error); process.exitCode = 1; });

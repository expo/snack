import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('creates bundle for @sentry/react-native@3.4.2', async () => {
  // This included a lot of new externals, see ../bundler/externals.ts
  const bundle = await bundleAsync('@sentry/react-native@3.4.2');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
});

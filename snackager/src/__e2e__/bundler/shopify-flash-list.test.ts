import { bundleAsync } from '../bundleAsync';

it('creates bundle for @shopify/flash-list@1.2.0 without babel peer dependency', async () => {
  // This version adds `@babel/runtime` as peer dependency, causing weird behavior in snack website.
  const bundle = await bundleAsync('@shopify/flash-list@1.2.0');
  expect(bundle.peerDependencies).not.toHaveProperty('@babel/runtime');
});

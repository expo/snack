import { bundleAsync, normalizeBundleSize } from '../bundleAsync';

it('creates bundle for graphql@14.0.0', async () => {
  // This library was causing issues in aws-amplify because of mjs files.
  // It's imported by @aws-amplify/api -> @aws-amplify/api-graphql -> graphql,
  // because aws-amplify is HUGE, we are only testing `graphql@14.0.0` here.
  // see: https://github.com/graphql/graphql-js/issues/1272
  const bundle = await bundleAsync('graphql@14.0.0');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // Also validate that we don't have any relative extenals
  ['android', 'ios', 'web'].forEach((platform) => {
    expect(bundle.files[platform]['bundle.js'].externals).not.toEqual(
      expect.arrayContaining([expect.stringContaining('./')]),
    );
  });
});

it('creates bundle for graphql@15.5.1', async () => {
  // This version of graphql contains a fix for the issue in graphql@14.
  // In this version, mjs files have the `.mjs` extension when imported.
  const bundle = await bundleAsync('graphql@15.5.1');
  expect(normalizeBundleSize(bundle)).toMatchSnapshot();
  // Also validate that we don't have any relative externals
  ['android', 'ios', 'web'].forEach((platform) => {
    expect(bundle.files[platform]['bundle.js'].externals).not.toEqual(
      expect.arrayContaining([expect.stringContaining('./')]),
    );
  });
});

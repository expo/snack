import { bundleAsync } from '../bundleAsync';

it('compiles packages that use reanimated2', async () => {
  const bundle = await bundleAsync('moti@0.10.0', undefined, true);
  ['ios', 'android', 'web'].forEach((platform) => {
    expect(bundle.files[platform]['bundle.js'].code!.match(/worklet/g)!.length).toBe(11);
    expect(bundle.files[platform]['bundle.js'].size).toBeLessThanOrEqual(200000);
    expect(bundle.files[platform]['bundle.js'].externals).toEqual(
      expect.arrayContaining(['react-native-reanimated']),
    );
  });
});

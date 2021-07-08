import getCachePrefix from '../../cache-busting';

it('returns only global cache prefix for unlisted package', () => {
  expect(getCachePrefix('some-unlisted-package')).toMatch(/^\d$/); // "1"
});

it('returns valid cache prefix for listed package', () => {
  expect(getCachePrefix('react-native-reanimated')).toMatch(/^\d-\d$/); // "1-1"
});

it('returns valid cache prefix for listed package with wildcard', () => {
  expect(getCachePrefix('@expo-google-fonts/inter')).toMatch(/^\d-\d$/); // "1-1"
});

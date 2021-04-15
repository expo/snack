import { Metadata } from '../../types';
import resolveDependencies from '../resolveDependencies';

const metaFixture: Metadata = {
  name: '<package>',
  'dist-tags': {
    latest: '1.0.0',
    'vector-icons': '1.1.0',
    'windows-dep': '2.0.0',
    'windows-peer': '2.1.0',
  },
  versions: {
    '1.0.0': { name: '<package>', version: '1.0.0', dist: {} as any },
    '1.0.1': { name: '<package>', version: '1.0.1', dist: {} as any },
    '1.1.0': {
      name: '<package>',
      version: '1.1.0',
      dist: {} as any,
      peerDependencies: { 'react-native-vector-icons': 'latest' },
    },
    '2.0.0': {
      name: '<package>',
      version: '2.0.0',
      dist: {} as any,
      dependencies: { 'react-native-windows': 'latest' },
    },
    '2.1.0': {
      name: '<package>',
      version: '2.1.0',
      dist: {} as any,
      peerDependencies: { 'react-native-windows': 'latest' },
    },
  },
};

it('returns non-latest version', () => {
  expect(resolveDependencies(metaFixture, '1.0.1', false)).toMatchObject({
    pkg: metaFixture.versions['1.0.1'],
    hash: '<package>@1.0.1',
    latestHash: null,
  });
});

it('returns latest version and deep module', () => {
  expect(resolveDependencies(metaFixture, '1.0.0', true, 'lib/some/module')).toMatchObject({
    pkg: metaFixture.versions['1.0.0'],
    hash: '<package>~lib~some~module@1.0.0',
    latestHash: '<package>~lib~some~module@latest',
  });
});

it('adds `@expo/vector-icons` instead of `react-native-vector-icons` as peer dependency', () => {
  const result = resolveDependencies(metaFixture, metaFixture['dist-tags']['vector-icons'], true);
  expect(result).toHaveProperty('dependencies.@expo/vector-icons');
  expect(result).not.toHaveProperty('dependencies.react-native-vector-icons');
});

it('ignores `react-native-windows` as dependency', () => {
  const result = resolveDependencies(metaFixture, metaFixture['dist-tags']['windows-dep'], false);
  expect(result).not.toHaveProperty('dependencies.react-native-windows');
});

it('ignores `react-native-windows` as peer dependency', () => {
  const result = resolveDependencies(metaFixture, metaFixture['dist-tags']['windows-peer'], false);
  expect(result).not.toHaveProperty('dependencies.react-native-windows');
});

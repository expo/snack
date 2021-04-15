import { Metadata } from '../../types';
import findVersion from '../findVersion';

const metaFixture: Metadata = {
  name: '<package>',
  'dist-tags': {
    latest: '1.2.3',
    canary: '2.0.1',
    'doesnt-exists': '3.0.0',
    invalid: 'flutter',
  },
  versions: {
    '1.1.0': { name: '<package>', version: '1.1.0', dist: {} as any },
    '1.2.0': { name: '<package>', version: '1.2.0', dist: {} as any },
    '1.2.3': { name: '<package>', version: '1.2.3', dist: {} as any },
    '2.0.0': { name: '<package>', version: '2.0.0', dist: {} as any },
    '2.0.1': { name: '<package>', version: '2.0.1', dist: {} as any },
  },
};

it('returns latest version for latest tag', () => {
  expect(findVersion(metaFixture.name, metaFixture, 'latest')).toMatchObject({
    version: metaFixture['dist-tags'].latest,
    isLatest: true,
  });
});

it('returns dist-tag version for custom tag', () => {
  expect(findVersion(metaFixture.name, metaFixture, 'canary')).toMatchObject({
    version: metaFixture['dist-tags'].canary,
    isLatest: false,
  });
});

it('returns dist-tag version for custom tag without existing version', () => {
  expect(findVersion(metaFixture.name, metaFixture, 'doesnt-exists')).toMatchObject({
    version: metaFixture['dist-tags']['doesnt-exists'],
    isLatest: false,
  });
});

it('returns prerelease version for wildcard tag', () => {
  expect(findVersion(metaFixture.name, metaFixture, '*')).toMatchObject({
    version: '2.0.1',
    isLatest: false,
  });
});

it('returns latest version for wildcard tag when no versions are defined', () => {
  const metaCopy = { ...metaFixture, versions: {} };
  expect(findVersion(metaCopy.name, metaCopy, '*')).toMatchObject({
    version: metaFixture['dist-tags'].latest,
    isLatest: true,
  });
});

it('returns version for exact semver tag', () => {
  expect(findVersion(metaFixture.name, metaFixture, '1.1.0')).toMatchObject({
    version: '1.1.0',
    isLatest: false,
  });
});

it('throws when dist-tag version is invalid', () => {
  expect(() => findVersion(metaFixture.name, metaFixture, 'invalid')).toThrow('Invalid version');
});

it('throws when dist-tag or version is not found', () => {
  expect(() => findVersion(metaFixture.name, metaFixture, 'flutter')).toThrow('not found');
});

import { getSdkVersionFromExpoPackageVersion } from '../getSdkVersionFromExpoPackageVersion';

it.each(['50.0.20', '~50.0.20', '^50.0.0', '50.x', '>=50.0.0 <51.0.0', '^50.0.0 || ~50.1.0'])(
  'identifies the SDK from %s',
  (version) => {
    expect(getSdkVersionFromExpoPackageVersion(version)).toBe('50.0.0');
  },
);

it.each([
  undefined,
  null,
  50,
  {},
  '',
  'latest',
  '>=50.0.0 <50.0.0',
  'github:expo/expo',
  'file:../expo',
  'workspace:*',
])('leaves the SDK unresolved for %p', (version) => {
  expect(getSdkVersionFromExpoPackageVersion(version)).toBeNull();
});

it('preserves an unsupported SDK for the importer to handle', () => {
  expect(getSdkVersionFromExpoPackageVersion('~22.0.0')).toBe('22.0.0');
});

it.each(['50.0.0-alpha.1', '50.0.0-beta.1', '~50.0.0-beta.1', '^50.0.0-alpha.1'])(
  'identifies the SDK from prerelease dependency %s',
  (version) => {
    expect(getSdkVersionFromExpoPackageVersion(version)).toBe('50.0.0');
  },
);

it.each([
  ['>=50.0.0', '50.0.0'],
  ['^49.0.0 || ^50.0.0', '49.0.0'],
  ['*', '0.0.0'],
])('uses the minimum version of %s to infer SDK %s', (dependency, sdkVersion) => {
  expect(getSdkVersionFromExpoPackageVersion(dependency)).toBe(sdkVersion);
});

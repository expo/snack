// TODO: find the typescript definitions for this package, `@types/sander` doesn't exists
const { existsSync } = require('sander');

function _trailingSegment(pkgName: string): string {
  const segments = pkgName.split('/');
  return segments[segments.length - 1];
}

export default function findPath(pkgName: string, dir: string): string[] {
  const options = ['package', _trailingSegment(pkgName)];
  const result = options.filter((subpath) => existsSync(`${dir}/${subpath}`));
  return result;
}

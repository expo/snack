import { getUniquePath } from '../fileUtilities';

it('generates unique path', () => {
  const paths = [
    'test/App.js',
    'test/components',
    'test/something.js',
    'test/something 1.js',
    'test/something copy.js',
  ];

  expect(getUniquePath(paths, 'test/something.js')).toBe('test/something 2.js');
  expect(getUniquePath(paths, 'test/something.js', 'copy')).toBe('test/something copy 1.js');
});

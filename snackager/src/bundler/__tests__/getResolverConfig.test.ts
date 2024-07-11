import getResolverConfig from '../getResolverConfig';

describe(getResolverConfig, () => {
  it('returns correct extensions for android', () => {
    expect(getResolverConfig('android').extensions).toEqual([
      '.android.ts',
      '.android.tsx',
      '.android.mjs',
      '.android.js',
      '.android.jsx',
      '.android.json',
      '.android.cjs',
      '.native.ts',
      '.native.tsx',
      '.native.mjs',
      '.native.js',
      '.native.jsx',
      '.native.json',
      '.native.cjs',
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
      '.cjs',
    ]);
  });

  it('returns correct extensions for ios', () => {
    expect(getResolverConfig('ios').extensions).toEqual([
      '.ios.ts',
      '.ios.tsx',
      '.ios.mjs',
      '.ios.js',
      '.ios.jsx',
      '.ios.json',
      '.ios.cjs',
      '.native.ts',
      '.native.tsx',
      '.native.mjs',
      '.native.js',
      '.native.jsx',
      '.native.json',
      '.native.cjs',
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
      '.cjs',
    ]);
  });

  it('returns correct extensions for web', () => {
    expect(getResolverConfig('web').extensions).toEqual([
      '.web.ts',
      '.web.tsx',
      '.web.mjs',
      '.web.js',
      '.web.jsx',
      '.web.json',
      '.web.cjs',
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
      '.cjs',
    ]);
  });

  it('returns default extensions for unknown platforms', () => {
    expect(getResolverConfig('unknown').extensions).toEqual([
      '.ts',
      '.tsx',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
      '.cjs',
    ]);
  });
});

import { ResolveOptions } from 'webpack';

import AssetResolver from './AssetResolver';

export default function getResolverConfig(platform: string): ResolveOptions {
  return {
    // TODO: figure out whether AssetResolver as a plugin is obsolete and can be removed
    plugins: [new AssetResolver({ platform })],
    mainFields: [...(platform !== 'web' ? ['react-native'] : []), 'browser', 'module', 'main'],
    extensions: [
      `.${platform}.tsx`,
      `.${platform}.ts`,
      `.${platform}.cjs`,
      `.${platform}.js`,
      ...(platform !== 'web' ? ['.native.tsx', '.native.ts', '.native.js', '.native.cjs'] : []),
      '.tsx',
      '.ts',
      '.cjs',
      '.js',
    ],
  };
}

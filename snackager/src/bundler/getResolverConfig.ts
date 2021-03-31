import { Resolve } from 'webpack';

import AssetResolver from './AssetResolver';

export default function getResolverConfig(platform: string): Resolve {
  return {
    plugins: [new AssetResolver({ platform })],
    mainFields: [...(platform !== 'web' ? ['react-native'] : []), 'browser', 'module', 'main'],
    extensions: [
      `.${platform}.expo.tsx`,
      `.${platform}.expo.ts`,
      `.${platform}.expo.js`,
      ...(platform !== 'web' ? ['.native.expo.tsx', '.native.expo.ts', '.native.expo.js'] : []),
      `.expo.tsx`,
      `.expo.ts`,
      `.expo.js`,
      `.${platform}.tsx`,
      `.${platform}.ts`,
      `.${platform}.js`,
      ...(platform !== 'web' ? ['.native.tsx', '.native.ts', '.native.js'] : []),
      '.tsx',
      '.ts',
      '.js',
    ],
  };
}

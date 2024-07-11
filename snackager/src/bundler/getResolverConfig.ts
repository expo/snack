import { ResolveOptions } from 'webpack';

import AssetResolver from './AssetResolver';

const extensions = ['.tsx', '.ts', '.mjs', '.cjs', '.jsx', '.js'];

export default function getResolverConfig(platform: string): ResolveOptions {
  return {
    // TODO: figure out whether AssetResolver as a plugin is obsolete and can be removed
    plugins: [new AssetResolver({ platform })],
    mainFields: [...(platform !== 'web' ? ['react-native'] : []), 'browser', 'module', 'main'],
    extensions: [
      ...extensions.map((ext) => `.${platform}.expo${ext}`),
      ...(platform !== 'web' ? extensions.map((ext) => `.native.expo${ext}`) : []),
      ...extensions.map((ext) => `.expo${ext}`),
      ...extensions.map((ext) => `.${platform}${ext}`),
      ...(platform !== 'web' ? extensions.map((ext) => `.native${ext}`) : []),
      ...extensions,
    ],
  };
}

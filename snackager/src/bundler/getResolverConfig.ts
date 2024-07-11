import { ResolveOptions } from 'webpack';

import AssetResolver from './AssetResolver';

export default function getResolverConfig(platform: string): ResolveOptions {
  return {
    // TODO: figure out whether AssetResolver as a plugin is obsolete and can be removed
    plugins: [new AssetResolver({ platform })],
    mainFields: [...(platform !== 'web' ? ['react-native'] : []), 'browser', 'module', 'main'],
    extensions: createPlatformExtensions(platform),
  };
}

// See @expo/metro-config extensions - through EXPO_DEBUG=true npx expo start
const EXTENSIONS_LANGUAGE = ['ts', 'tsx', 'mjs', 'js', 'jsx', 'json', 'cjs'];
const EXTENSIONS_PLATFORM = {
  web: ['web', ''],
  ios: ['ios', 'native', ''],
  android: ['android', 'native', ''],
};

function createPlatformExtensions(platform: string) {
  const extensions: string[] = [];

  for (const platformExt of EXTENSIONS_PLATFORM[platform] ?? ['']) {
    for (const langExt of EXTENSIONS_LANGUAGE) {
      extensions.push(platformExt ? `.${platformExt}.${langExt}` : `.${langExt}`);
    }
  }

  return extensions;
}

import semver from 'semver';

import { targetPlatform } from './platform';
import type { Platform } from './types';
const common = {
  'expo-image': '58.0.18',
  'expo-audio': '58.0.12',
  'expo-video': '58.0.14',

  'react-native': '0.88.1',
  'react-native-safe-area-context': '5.11.1',
  '@expo/ui': '58.0.28',
  'expo-font': '58.0.12',
  'react-native-svg': '15.16.0',
  'expo-linear-gradient': '58.0.4',
  'react-native-gesture-handler': '3.3.0',
  'react-native-reanimated': '4.7.1',
  'react-native-worklets': '0.13.0',
};
export const runtimeProfiles: Record<Platform, Record<string, string>> = {
  web: { ...common, react: '19.3.1', 'react-dom': '19.3.1' },
  ios: { ...common, react: '19.3.0' },
  android: { ...common, react: '19.3.0' },
};
export const runtimeNames = new Set(Object.values(runtimeProfiles).flatMap(Object.keys));
export function supportsRuntime(name: string, range: string) {
  return Object.values(runtimeProfiles).some(
    (profile) => profile[name] && semver.satisfies(profile[name], range),
  );
}
export function validateRuntime(name: string, range: string, platform: Platform, owner: string) {
  const version = runtimeProfiles[targetPlatform(platform)][name];
  if (!version || !semver.satisfies(version, range)) {
    throw Error(
      `Incompatible runtime ${name}@${range} required by ${owner} on ${platform}; supplied ${
        version || 'none'
      }`,
    );
  }
}

export const executorProfiles: Record<string, Record<string, string>> = {
  web: { react: '19.3.1' },
  sdk58: { react: '19.3.0' },
};
export function executorProfile(name: string) {
  if (!Object.hasOwn(executorProfiles, name)) throw Error('Unknown executor profile: ' + name);
  return executorProfiles[name];
}

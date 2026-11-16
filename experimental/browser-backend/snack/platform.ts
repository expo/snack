import type { Platform } from './types';
export function targetPlatform(value: string = 'web') {
  if (!['web', 'ios', 'android'].includes(value)) throw Error('Unsupported target platform');
  return value as Platform;
}
export function sourceSuffixes(platform: Platform) {
  const extensions = ['js', 'jsx', 'json', 'ts', 'tsx', 'mjs', 'cjs'];
  return [
    '',
    ...extensions.flatMap((ext) => [
      `.${platform}.${ext}`,
      ...(platform === 'web' ? [] : [`.native.${ext}`]),
      `.${ext}`,
    ]),
  ];
}

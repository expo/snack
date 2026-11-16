// SDK 58 exposes this helper at runtime but does not export its package subpath types.
declare module 'expo-font/build/FontLoader' {
  export const loadFontFamilyAsync: typeof import('../../node_modules/expo-font/build/FontLoader').loadFontFamilyAsync;
}

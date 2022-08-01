/** All hard-coded and vendored types */
export const vendoredTypes: Record<string, string> = {
  // Workaround for React 17+ and auto jsx runtime
  // See: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/d7b179c7a9a4aa4ff13f0608606ae10a94349014/types/react/jsx-runtime.d.ts#L2
  ...makeModuleType('react/jsx-runtime', `import 'react';`),
  // See: /runtime/src/NativeModules/ReactNativeSkia.tsx
  ...makeModuleType(
    '@shopify/react-native-skia/dist/web',
    `declare module "@shopify/react-native-skia/dist/web" {
      import { Suspense, ComponentProps, ComponentType } from 'react';
      interface WithSkiaProps {
          fallback?: ComponentProps<typeof Suspense>['fallback'];
          getComponent: () => Promise<{
              default: ComponentType;
          }>;
      }
      export function WithSkia({ fallback, getComponent }: WithSkiaProps): JSX.Element;
      export function LoadSkia(): Promise<void>;
    }`
  ),
};

/**
 * Create a declaration file for a specific import path.
 * This outputs both the `<pkg>/package.json` and `<pkg>/index.d.ts` files.
 * The package file needs to point to the loaded declaration file, without that the types are not picked up.
 */
function makeModuleType(importName: string, declarationContent: string): Record<string, string> {
  return {
    // For each import path, we need to fake a package file, pointing to the right declarations.
    [`node_modules/${importName}/package.json`]: JSON.stringify({
      name: importName,
      version: '1.0.0',
      types: './index.d.ts',
    }),
    // The declaration also needs to be wrapped inside `declare module "<pkg>" { ... }`
    [`node_modules/${importName}/index.d.ts`]: declarationContent,
  };
}

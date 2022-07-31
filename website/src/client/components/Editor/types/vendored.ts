/** All hard-coded and vendored types */
export const vendoredTypes: Record<string, string> = {
  // Workaround for React 17+ and auto jsx runtime
  // See: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/d7b179c7a9a4aa4ff13f0608606ae10a94349014/types/react/jsx-runtime.d.ts#L2
  ...makeModuleType('react/jsx-runtime', `import 'react';`),
  // See: /runtime/src/NativeModules/ReactNativeSkia.tsx
  ...makeModuleType(
    '@shopify/react-native-skia/lib/module/web',
    `declare module "@shopify/react-native-skia/lib/module/web" {
      import React, { Suspense } from 'react';
      interface CanvasKitInitOptions {
        /**
         * This callback will be invoked when the CanvasKit loader needs to fetch a file (e.g.
         * the blob of WASM code). The correct url prefix should be applied.
         * @param file - the name of the file that is about to be loaded.
         */
        locateFile(file: string): string;
      }
      interface WithSkiaProps {
          /**
           * The component fetcher, should be a lazy-loaded component.
           * It should be returned as \`{ default: <Component /> }\`, use default exports.
           * E.g. \`getComponent={() => import('./components/Lazy.tsx')}\`
           */
          getComponent: () => Promise<{ default: React.ComponentType }>;
          /** The content to render when CanvasKit is still loading (default: \`null\`) */
          fallback?: React.ComponentProps<typeof Suspense>['fallback'];
          /**
           * The options to use when initializing CavasKit on web.
           * In Snack, this defaults to the right default options.
           * You can change these options if you know what you are doing.
           */
          opts?: CanvasKitInitOptions;
      }
      /**
       * Wrap a lazy-loaded component inside CanvasKit for web.
       * In Snack, using this will enable Skia to run natively and on web, without code changes.
       * The component works by wrapping the lazy-loaded component in Suspense.
       */
      export function WithSkiaWeb({ fallback, getComponent, opts: options }: WithSkiaProps): JSX.Element;
      /**
       * Load CanvasKit on web by initializing the WASM file.
       * In Snack, this defaults to the right default options.
       * You can change these options if you know what you are doing.
       */
       export function LoadSkiaWeb(options?: CanvasKitInitOptions): Promise<void>;
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

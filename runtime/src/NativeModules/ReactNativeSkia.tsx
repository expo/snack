// This file enables `@shopify/react-native-skia` web support
// It's a Snack-specific version of:
// https://github.com/Shopify/react-native-skia/blob/main/package/src/web/WithSkiaWeb.tsx
import React, { Suspense } from 'react';

import { loadCanvasKit } from './CanvasKit';

interface WithSkiaProps {
  /**
   * The component fetcher, should be a lazy-loaded component.
   * It should be returned as `{ default: <Component /> }`, use default exports.
   * E.g. `getComponent={() => import('./components/LazyComponent')}
   */
  getComponent: () => Promise<{ default: React.ComponentType }>;

  /** The content to render when CanvasKit is still loading (default: `null`) */
  fallback?: React.ComponentProps<typeof Suspense>['fallback'];

  /**
   * The options to use when initializing CavasKit on web.
   * In Snack, this defaults to the right default options.
   * You can change these options if you know what you are doing.
   */
  opts?: Parameters<typeof loadCanvasKit>[0];
}

/**
 * Wrap a lazy-loaded component inside CanvasKit for web.
 * In Snack, using this will enable Skia to run natively and on web, without code changes.
 * The component works by wrapping the lazy-loaded component in Suspense.
 *
 * @see https://shopify.github.io/react-native-skia/docs/getting-started/web/
 */
export function WithSkiaWeb({ fallback, getComponent, opts: options }: WithSkiaProps) {
  const Inner = React.useMemo(
    () =>
      React.lazy(async () => {
        await loadCanvasKit(options);
        return getComponent();
      }),
    [getComponent, options],
  );

  return (
    <Suspense fallback={fallback ?? null}>
      <Inner />
    </Suspense>
  );
}

/**
 * Load CanvasKit on web by initializing the WASM file.
 * In Snack, this defaults to the right default options.
 * You can change these options if you know what you are doing.
 *
 * @see https://shopify.github.io/react-native-skia/docs/getting-started/web/
 */
export const LoadSkiaWeb = loadCanvasKit;

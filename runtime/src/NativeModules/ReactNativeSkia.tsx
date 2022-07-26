// This file enables `@shopify/react-native-skia` web support
// It's a Snack-specific version of https://github.com/Shopify/react-native-skia/blob/5adbade804191deef4380ae42796d3b5f050dad7/package/src/web/WithSkia.tsx
import React, { Suspense, useMemo } from 'react';

import { loadCanvasKit } from './CanvasKit';

interface WithSkiaProps {
  fallback?: React.ComponentProps<typeof Suspense>['fallback'];
  getComponent: () => Promise<{ default: React.ComponentType }>;
}

/**
 * This loads CanvasKit on web, before loading the `getComponent`.
 * Note that `await import` is not yet supported in Snack,
 * use `require` inside `getComponent` instead.
 */
export function WithSkia({ fallback, getComponent }: WithSkiaProps) {
  const Inner = useMemo(
    () =>
      React.lazy(async () => {
        await loadCanvasKit();
        return getComponent();
      }),
    [getComponent]
  );

  return (
    <Suspense fallback={fallback}>
      <Inner />
    </Suspense>
  );
}

/** Same as the API from the original `@shopify/react-native-skia/dist/web` */
export const LoadSkia = loadCanvasKit;

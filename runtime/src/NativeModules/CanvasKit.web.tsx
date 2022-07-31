// Types are monkey-patched in runtime/types/canvaskit-wasm.d.ts
import type { CanvasKit as CanvasKitType, CanvasKitInitOptions } from 'canvaskit-wasm';
import CanvasKitInit from 'canvaskit-wasm/bin/full/canvaskit';
import { version } from 'canvaskit-wasm/package.json';

declare global {
  // eslint-disable-next-line no-var
  var CanvasKit: CanvasKitType | undefined;
}

/**
 * This loads CanvasKit from jsDelivr instead of a local file.
 * It's because we can't serve canvaskit.wasm on the expected path when running locally.
 * Keep this API in sync with: https://github.com/Shopify/react-native-skia/blob/main/package/src/web/WithSkiaWeb.tsx
 */
export async function loadCanvasKit(options?: CanvasKitInitOptions) {
  // Don't reinitialize if it's there already
  if (global.CanvasKit) {
    return;
  }

  // Use default configuration for Snack.
  // It loads the CanvasKit WASM compatible with the bundled JS.
  if (!options) {
    options = {
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${version}/bin/full/${file}`,
    };
  }

  // Store CanvasKit on the global namespace for Skia to interact with.
  global.CanvasKit = await CanvasKitInit(options);
}

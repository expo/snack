// Types are monkey-patched in runtime/types/canvaskit-wasm.d.ts
import type { CanvasKit as CanvasKitType } from 'canvaskit-wasm';
import CanvasKitInit from 'canvaskit-wasm/bin/full/canvaskit';
import { version } from 'canvaskit-wasm/package.json';

declare global {
  // eslint-disable-next-line no-var
  var CanvasKit: CanvasKitType | undefined;
}

/**
 * This loads CanvasKit from jsDelivr instead of a local file.
 * It's because we can't serve canvaskit.wasm on the expected path when running locally.
 */
export async function loadCanvasKit() {
  // Don't reinitialize if it's there already
  if (global.CanvasKit) return;
  global.CanvasKit = await CanvasKitInit({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${version}/bin/full/${file}`,
  });
}

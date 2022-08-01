import type { CanvasKitInitOptions } from 'canvaskit-wasm';

// This function should only be executed from web, on native it's a stub.
export function loadCanvasKit(options?: CanvasKitInitOptions) {
  return Promise.resolve();
}

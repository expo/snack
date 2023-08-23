// Types are monkey-patched in runtime/types/canvaskit-wasm.d.ts
import type { CanvasKit as CanvasKitType, CanvasKitInitOptions } from 'canvaskit-wasm';
import { version } from 'canvaskit-wasm/package.json';

type CanvasKitInit = (options: CanvasKitInitOptions) => CanvasKitType;

declare global {
  // eslint-disable-next-line no-var
  var CanvasKit: CanvasKitType | undefined;
  // eslint-disable-next-line no-var
  var CanvasKitInit: CanvasKitInit | undefined;
}

/**
 * This loads CanvasKit from jsDelivr instead of a local file.
 * It's because we can't serve canvaskit.wasm on the expected path when running locally.
 * Keep this API in sync with: https://github.com/Shopify/react-native-skia/blob/main/package/src/web/WithSkiaWeb.tsx
 */
export async function loadCanvasKit(options?: CanvasKitInitOptions) {
  // Don't reinitialize if it's there already
  if (global.CanvasKit) return;
  // Initialize the script if it hasn't been loaded yet.
  if (!global.CanvasKitInit) await loadCanvasKitScript();

  // Use default configuration for Snack.
  // It loads the CanvasKit WASM compatible with the bundled JS.
  if (!options) {
    options = {
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${version}/bin/full/${file}`,
    };
  }

  // Store CanvasKit on the global namespace for Skia to interact with.
  if (global.CanvasKitInit) {
    global.CanvasKit = await global.CanvasKitInit(options);
  } else {
    console.error(
      'CanvasKitInit is not loaded, this is likely an issue with Snack. - Open a new issue at http://github.com/expo/snack.'
    );
  }
}

export async function loadCanvasKitScript() {
  return await new Promise((resolve, reject) => {
    const $script = document.createElement('script');

    $script.addEventListener('load', resolve);
    $script.addEventListener('error', reject);

    $script.setAttribute('id', `canvaskit@${version}`);
    $script.setAttribute('type', 'text/javascript');
    $script.setAttribute('async', '');
    $script.setAttribute(
      'src',
      `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${version}/bin/full/canvaskit.js`
    );

    document.body.appendChild($script);
  });
}

type BabelPluginOrPresetName = string | [string, ...any];

/** Load the Babel plugin module from the bundled plugins */
export function loadPlugin(name: BabelPluginOrPresetName): any;

/** Load the Babel preset module from the bundled presets */
export function loadPreset(name: BabelPluginOrPresetName): any;

  /** Helper function to process options and resolve local plugins and presets */
  export function processOptions(options: any): any;

/** Registers a named plugin for use with Babel. */
export function registerPlugin(name: string, plugin: any): void;

/**
 * Registers multiple plugins for use with Babel. `plugins` should be an object where the key
 * is the name of the plugin, and the value is the plugin itself.
 */
export function registerPlugins(plugins: Record<string, any>): void;

/** Registers a named preset for use with Babel. */
export function registerPreset(name: string, plugin: any): void;

/**
 * Registers multiple presets for use with Babel. `newPresets` should be an object where the key
 * is the name of the preset, and the value is the preset itself.
 */
export function registerPresets(presets: Record<string, any>): void;

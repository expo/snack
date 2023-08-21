/**
 * This wraps Babel's API in a version that's friendlier for use in web and native.
 * It removes the automagical detection of plugins, instead explicitly registering
 * all the available plugins and presets, and requiring custom ones to be registered
 * through `registerPlugin(s)` and `registerPreset(s)` respectively.
 *
 * Copied from https://github.com/babel/babel/blob/master/packages/babel-standalone/src/index.js
 */

type BundledModules = Record<string, any>;
type BabelPluginOrPresetName = string | [string, ...any];

const availablePlugins: BundledModules = {};
const availablePresets: BundledModules = {};

const isArray =
  Array.isArray ||
  (arg => Object.prototype.toString.call(arg) === '[object Array]');

/**
 * Loads the given name (or [name, options] pair) from the given table object
 * holding the available presets or plugins.
 *
 * Returns undefined if the preset or plugin is not available; passes through
 * name unmodified if it (or the first element of the pair) is not a string.
 */
function loadBuiltin(builtinTable: BundledModules, name: BabelPluginOrPresetName) {
  if (isArray(name) && typeof name[0] === 'string') {
    if (builtinTable.hasOwnProperty(name[0])) {
      return [builtinTable[name[0]]].concat(name.slice(1));
    }
    return;
  } else if (typeof name === 'string') {
    return builtinTable[name];
  }
  // Could be an actual preset/plugin module
  return name;
}

/**
 * Load the bundled plugin by name or [name, options] pairs.
 */
export function loadPlugin(name: BabelPluginOrPresetName) {
  return loadBuiltin(availablePlugins, name);
}

/**
 * Load the bundled preset by name or [name, options] pairs.
 */
export function loadPreset(name: BabelPluginOrPresetName) {
  return loadBuiltin(availablePlugins, name);
}

/** Process the Babel options by replacing the preset and plugins with the built-in ones */
export function processOptions(options: any = {}) {
  const presets = (options.presets || []).map(presetName => {
    const preset = loadBuiltin(availablePresets, presetName);

    if (preset) {
      // workaround for babel issue
      // at some point, babel copies the preset, losing the non-enumerable
      // buildPreset key; convert it into an enumerable key.
      if (
        isArray(preset) &&
        typeof preset[0] === 'object' &&
        preset[0].hasOwnProperty('buildPreset')
      ) {
        preset[0] = { ...preset[0], buildPreset: preset[0].buildPreset };
      }
    } else {
      throw new Error(
        `Invalid preset specified in Babel options: "${presetName}"`
      );
    }
    return preset;
  });

  // Parse plugin names
  const plugins = (options.plugins || []).map(pluginName => {
    const plugin = loadBuiltin(availablePlugins, pluginName);

    if (!plugin) {
      throw new Error(
        `Invalid plugin specified in Babel options: "${pluginName}"`
      );
    }
    return plugin;
  });

  return {
    babelrc: false,
    ...options,
    presets,
    plugins,
  };
}

/**
 * Registers a named plugin for use within the standalone Babel.
 */
export function registerPlugin(name, plugin) {
  if (availablePlugins.hasOwnProperty(name)) {
    console.warn(
      `A plugin named "${name}" is already registered, it will be overridden`
    );
  }
  availablePlugins[name] = plugin;
}

/**
 * Registers multiple plugins for use within the standalone Babel.
 * `newPlugins` should be an object where the key is the name of
 * the plugin, and the value is the plugin itself.
 */
export function registerPlugins(newPlugins) {
  Object.keys(newPlugins).forEach((name) =>
    registerPlugin(name, newPlugins[name])
  );
}

/**
 * Registers a named preset for use within the standalone Babel.
 */
export function registerPreset(name, preset) {
  if (availablePresets.hasOwnProperty(name)) {
    console.warn(
      `A preset named "${name}" is already registered, it will be overridden`
    );
  }
  availablePresets[name] = preset;
}

/**
 * Registers multiple presets for use within the standalone Babel.
 * `newPresets` should be an object where the key is the name of
 * the preset, and the value is the preset itself.
 */
export function registerPresets(newPresets) {
 Object.keys(newPresets).forEach(name =>
   registerPreset(name, newPresets[name])
 );
}

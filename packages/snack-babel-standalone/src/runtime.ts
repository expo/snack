/**
 * Entry point for @babel/standalone. This wraps Babel's API in a version that's
 * friendlier for use in web browers. It removes the automagical detection of
 * plugins, instead explicitly registering all the available plugins and
 * presets, and requiring custom ones to be registered through `registerPlugin`
 * and `registerPreset` respectively.
 *
 * Copied from https://github.com/babel/babel/blob/master/packages/babel-standalone/src/index.js
 */

import * as Babel from '@babel/core';
import * as Generator from '@babel/generator';
import * as Traverse from '@babel/traverse';
import * as Parser from '@babel/parser';

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
function loadBuiltin(builtinTable, name) {
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
 * Parses plugin names and presets from the specified options.
 * Exported for reuse in `./eslint`.
 */
export function processOptions(options) {
  // Parse preset names
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

export function transform(code, options) {
  return Babel.transform(code, processOptions(options));
}

export function transformSync(code, options) {
  return Babel.transformSync(code, processOptions(options));
}

export function transformAsync(code, options) {
  return Babel.transformAsync(code, processOptions(options));
}

export function transformFromAst(ast, code, options) {
  return Babel.transformFromAst(ast, code, processOptions(options));
}

export function generate(ast, opts, code) {
  return Generator.default(ast, opts, code);
}

export function traverse(parent, opts, scope, state, parentPath) {
  return Traverse.default(parent, opts, scope, state, parentPath);
}

export const visitors = Traverse.visitors;
export const template = Babel.template;

export function parse(input, options) {
  return Parser.parse(input, options);
}

// Standalone plugins registry

export const availablePlugins = {};
export const availablePresets = {};

// Untyped internal, but we still want to expose it.
// See: https://github.com/babel/babel/blob/f1ac2906b1066e47503e4d82d0602acd4be94e60/packages/babel-core/src/index.ts#L6
// @ts-expect-error Property 'buildExternalHelpers' does not exist
export const buildExternalHelpers = Babel.buildExternalHelpers;

/**
 * Registers a named plugin for use with Babel.
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
 * Registers multiple plugins for use with Babel. `newPlugins` should be an object where the key
 * is the name of the plugin, and the value is the plugin itself.
 */
export function registerPlugins(newPlugins) {
  Object.keys(newPlugins).forEach((name) =>
    registerPlugin(name, newPlugins[name])
  );
}

/**
 * Registers a named preset for use with Babel.
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
 * Registers multiple presets for use with Babel. `newPresets` should be an object where the key
 * is the name of the preset, and the value is the preset itself.
 */
export function registerPresets(newPresets) {
  Object.keys(newPresets).forEach(name =>
    registerPreset(name, newPresets[name])
  );
}

// Set through the webpack config, using `import('@babel/core').version`.
// @ts-expect-error Cannot find name 'VERSION'.
export const version = VERSION;

export function getPlugin(name) {
  const plugin = availablePlugins[name];
  if (plugin) {
    return plugin;
  }
  switch (name) {
    case "@babel/plugin-transform-object-assign":
      return require("@babel/plugin-transform-object-assign");
    default:
      return;
  }
}

// Register the compiled plugins and presets from this package

registerPlugins({
  '@babel/plugin-proposal-decorators': require('@babel/plugin-proposal-decorators').default,
  // Required to map `await import()` back to `require`, which works in systemjs
  '@babel/plugin-syntax-dynamic-import': require('@babel/plugin-syntax-dynamic-import'),
  '@babel/plugin-proposal-dynamic-import': require('@babel/plugin-proposal-dynamic-import'),
  // Required to skip the `import React from 'react';`
  '@babel/plugin-transform-react-jsx': require('@babel/plugin-transform-react-jsx'),
  // Required for using JSI host objects with async functions in React Native <=0.66
  '@babel/plugin-transform-async-to-generator': require('@babel/plugin-transform-async-to-generator').default,
  // Required for the Reanimated 2.3.x plugin
  '@babel/plugin-transform-shorthand-properties': require('@babel/plugin-transform-shorthand-properties').default,
  '@babel/plugin-transform-arrow-functions': require('@babel/plugin-transform-arrow-functions').default,
  '@babel/plugin-proposal-optional-chaining': require('@babel/plugin-proposal-optional-chaining').default,
  '@babel/plugin-proposal-nullish-coalescing-operator': require('@babel/plugin-proposal-nullish-coalescing-operator').default,
  '@babel/plugin-transform-template-literals': require('@babel/plugin-transform-template-literals').default,
});

registerPresets({
  'module:metro-react-native-babel-preset': require('metro-react-native-babel-preset').getPreset(null, {
    enableBabelRuntime: false,
  }),
  // Required for the Reanimated 2.3.x plugin
  '@babel/preset-typescript': require('@babel/preset-typescript').default,
});

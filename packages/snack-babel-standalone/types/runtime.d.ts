export { version, transform, transformFromAst, transformAsync, transformFileSync } from '@babel/core';
export { default as generate } from '@babel/generator';
export { default as traverse, visitors } from '@babel/traverse';
export { parse } from '@babel/parser';

export const availablePlugins: Record<string, any>;
export const availablePresets: Record<string, any>;

/**
 * Originally from `@babel/core`, but untyped internal.
 * @see https://github.com/babel/babel/blob/f1ac2906b1066e47503e4d82d0602acd4be94e60/packages/babel-core/src/index.ts#L6
 */
export type buildExternalHelpers = any;

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

/** Get a plugin instance from the bundled plugins */
export function getPlugin(name: string): any;

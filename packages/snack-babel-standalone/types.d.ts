export * from "@babel/core";
export { buildExternalHelpers } from '@babel/core';

export { default as generate } from "@babel/generator";
export { default as traverse, visitors } from "@babel/traverse";
export { parse } from "@babel/parser";

export const availablePlugins: Record<string, any>;
export const availablePresets: Record<string, any>;

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

export function getPlugin(name: string): any;

const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');
const config = getDefaultConfig(__dirname);
config.watchFolders = [...config.watchFolders, path.resolve(__dirname, '../packages')];
// Shared SDK validators must resolve this runtime's React and native dependencies.
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.join(__dirname, 'node_modules'),
  path.resolve(__dirname, '../node_modules'),
];
module.exports = config;

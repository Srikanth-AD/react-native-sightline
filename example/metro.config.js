const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the parent directory so Metro can resolve react-native-sightline source
config.watchFolders = [monorepoRoot];

// Only resolve node_modules from example/ first, then parent as fallback
// This ensures expo packages are found in example/node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Ensure react and react-native don't get duplicated
config.resolver.disableHierarchicalLookup = true;

module.exports = config;

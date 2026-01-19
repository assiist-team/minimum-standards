const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/**
 * Metro configuration for monorepo
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// Get the root of the monorepo
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const dictationRoot = path.resolve(monorepoRoot, '../react_native_dictation/react-native');

const config = {
  // Watch all files in the monorepo and local external packages
  watchFolders: [monorepoRoot, dictationRoot],
  
  resolver: {
    // Let Metro find modules from monorepo root
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
      path.resolve(dictationRoot, 'node_modules'),
    ],
    
    // Prevent duplicate react/react-native instances
    blacklistRE: exclusionList([
      new RegExp(`${dictationRoot}/node_modules/react/.*`),
      new RegExp(`${dictationRoot}/node_modules/react-native/.*`),
    ]),

    // Force resolution to project's dependencies
    extraNodeModules: {
      'react': path.resolve(projectRoot, 'node_modules/react'),
      'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
    },
    
    // Allow Metro to resolve workspace packages
    unstable_enableSymlinks: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

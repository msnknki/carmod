const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    blockList: [/node_modules\/.*\/android\/.*/],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

// expo-sqlite's web build imports wa-sqlite.wasm; Metro must treat .wasm as an
// asset or every bundle that touches src/db fails to resolve on web.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');

module.exports = config;

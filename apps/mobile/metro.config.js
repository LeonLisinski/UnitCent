// Metro za Expo + Sentry: dodaje identifikatore za source mapove (čitljive greške iz produkcijskih buildova).
// Web (samo za razvoj): expo-sqlite traži wasm i SharedArrayBuffer, pa dev server šalje COOP/COEP zaglavlja.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

config.resolver.assetExts.push("wasm");
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    return middleware(req, res, next);
  },
};

module.exports = config;

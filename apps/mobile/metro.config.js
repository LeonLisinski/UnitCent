// Metro za Expo + Sentry: dodaje identifikatore za source mapove (čitljive greške iz produkcijskih buildova).
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

module.exports = getSentryExpoConfig(__dirname);

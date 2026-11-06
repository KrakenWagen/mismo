const { getDefaultConfig } = require("@react-native/metro-config");
const { withMismo } = require("@mismo/react-navigation/metro");

// Writes the shared routes as navigators into src/navigation, and runs the shared screens' navigation on React Navigation.
module.exports = withMismo(getDefaultConfig(__dirname), {
  config: "../shared/routes.config.ts",
  outDir: "src/navigation",
  types: "src/routes.gen.ts",
  cwd: __dirname,
});

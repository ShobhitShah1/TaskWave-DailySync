const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  "@Components": path.resolve(__dirname, "app/Components"),
  "@Constants": path.resolve(__dirname, "app/Constants"),
  "@Contexts": path.resolve(__dirname, "app/Contexts"),
  "@Hooks": path.resolve(__dirname, "app/Hooks"),
  "@Routes": path.resolve(__dirname, "app/Routes"),
  "@Screens": path.resolve(__dirname, "app/Screens"),
  "@Services": path.resolve(__dirname, "app/Services"),
  "@Types": path.resolve(__dirname, "app/Types"),
  "@Utils": path.resolve(__dirname, "app/Utils")
};

module.exports = config; 
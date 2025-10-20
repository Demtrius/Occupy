// Learn more https://docs.expo.io/guides/customizing-metro
import path from "path";
import { getDefaultConfig } from "expo/metro-config";

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../../");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.sourceExts.push("ts", "tsx");

export default config;

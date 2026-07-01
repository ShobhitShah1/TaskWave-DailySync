const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PROPERTY_NAME = 'android.aapt2FromMavenOverride';

const normalizePath = (filePath) => filePath.replace(/\\/g, '/');

const readSdkDir = (androidProjectRoot) => {
  const localPropertiesPath = path.join(androidProjectRoot, 'local.properties');

  if (!fs.existsSync(localPropertiesPath)) {
    return null;
  }

  const contents = fs.readFileSync(localPropertiesPath, 'utf8');
  const match = contents.match(/^sdk\.dir=(.+)$/m);

  if (!match) {
    return null;
  }

  return match[1].replace(/\\:/g, ':').replace(/\\\\/g, '\\').trim();
};

const findAapt2 = (sdkDir) => {
  if (!sdkDir) {
    return null;
  }

  const buildToolsDir = path.join(sdkDir, 'build-tools');

  if (!fs.existsSync(buildToolsDir)) {
    return null;
  }

  const versions = fs
    .readdirSync(buildToolsDir)
    .filter((version) => fs.existsSync(path.join(buildToolsDir, version, 'aapt2.exe')))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  const preferredVersion = versions.includes('35.0.0') ? '35.0.0' : versions[0];

  return preferredVersion ? path.join(buildToolsDir, preferredVersion, 'aapt2.exe') : null;
};

const upsertGradleProperty = (contents, name, value) => {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, 'm');

  if (pattern.test(contents)) {
    return contents.replace(pattern, line);
  }

  return `${contents.trimEnd()}\n${line}\n`;
};

const withAndroidAapt2Override = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const androidProjectRoot = config.modRequest.platformProjectRoot;
      const gradlePropertiesPath = path.join(androidProjectRoot, 'gradle.properties');
      const sdkDir =
        readSdkDir(androidProjectRoot) ||
        process.env.ANDROID_HOME ||
        process.env.ANDROID_SDK_ROOT ||
        (process.env.LOCALAPPDATA
          ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')
          : null);
      const aapt2Path = findAapt2(sdkDir);

      if (!aapt2Path || !fs.existsSync(gradlePropertiesPath)) {
        return config;
      }

      const contents = fs.readFileSync(gradlePropertiesPath, 'utf8');
      fs.writeFileSync(
        gradlePropertiesPath,
        upsertGradleProperty(contents, PROPERTY_NAME, normalizePath(aapt2Path)),
      );

      return config;
    },
  ]);

module.exports = withAndroidAapt2Override;

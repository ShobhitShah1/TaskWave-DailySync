const { withDangerousMod, withAndroidManifest } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom Expo Config Plugin to handle Android Raw and XML resources.
 */
const withAndroidAssets = (config) => {
  // 1. Copy Raw Resources
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const rawDir = path.join(config.modRequest.projectRoot, 'raw');
      const destRawDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'raw',
      );

      if (fs.existsSync(rawDir)) {
        if (!fs.existsSync(destRawDir)) {
          fs.mkdirSync(destRawDir, { recursive: true });
        }
        const files = fs.readdirSync(rawDir);
        files.forEach((file) => {
          fs.copyFileSync(path.join(rawDir, file), path.join(destRawDir, file));
        });
      }
      return config;
    },
  ]);

  // 2. Copy XML Resources
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.projectRoot, 'xml');
      const destXmlDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml',
      );

      if (fs.existsSync(xmlDir)) {
        if (!fs.existsSync(destXmlDir)) {
          fs.mkdirSync(destXmlDir, { recursive: true });
        }
        const files = fs.readdirSync(xmlDir);
        files.forEach((file) => {
          fs.copyFileSync(path.join(xmlDir, file), path.join(destXmlDir, file));
        });
      }
      return config;
    },
  ]);

  // 3. Update AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const mainApplication = androidManifest.application[0];
    const packageName = config.android.package || 'com.taskwave.dailysync';

    // Ensure provider array exists
    if (!mainApplication.provider) {
      mainApplication.provider = [];
    }

    const providerName = 'androidx.core.content.FileProvider';
    const authorities = `${packageName}.provider`;

    // Remove existing provider if it has the same name to avoid duplicates/conflicts
    mainApplication.provider = mainApplication.provider.filter(
      (p) => p.$['android:name'] !== providerName,
    );

    // Add FileProvider
    mainApplication.provider.push({
      $: {
        'android:name': providerName,
        'android:authorities': authorities,
        'android:exported': 'false',
        'android:grantUriPermissions': 'true',
      },
      'meta-data': [
        {
          $: {
            'android:name': 'android.support.FILE_PROVIDER_PATHS',
            'android:resource': '@xml/filepaths',
          },
        },
      ],
    });

    // Add Queries
    if (!androidManifest.queries) {
      androidManifest.queries = [];
    }

    // We expect queries to be an array of objects that can contain 'package' and 'intent'
    if (androidManifest.queries.length === 0) {
      androidManifest.queries.push({});
    }

    const queries = androidManifest.queries[0];

    if (!queries.package) {
      queries.package = [];
    }
    if (!queries.intent) {
      queries.intent = [];
    }

    const targetPackages = [
      'com.whatsapp',
      'com.whatsapp.w4b',
      'org.telegram.messenger',
      'com.facebook.katana',
      'com.instagram.android',
    ];

    targetPackages.forEach((pkg) => {
      const exists = queries.package.some((p) => p.$ && p.$['android:name'] === pkg);
      if (!exists) {
        queries.package.push({ $: { 'android:name': pkg } });
      }
    });

    const commonIntents = [
      {
        action: [{ $: { 'android:name': 'android.intent.action.SEND' } }],
        data: [{ $: { 'android:mimeType': '*/*' } }],
      },
      {
        action: [{ $: { 'android:name': 'android.intent.action.SENDTO' } }],
        data: [{ $: { 'android:scheme': 'mailto' } }],
      },
    ];

    commonIntents.forEach((newIntent) => {
      // Simple check to avoid exact duplicates
      const exists = queries.intent.some(
        (i) =>
          i.action?.[0]?.$?.['android:name'] === newIntent.action[0].$['android:name'] &&
          i.data?.[0]?.$?.['android:mimeType'] === newIntent.data[0].$['android:mimeType'],
      );
      if (!exists) {
        queries.intent.push(newIntent);
      }
    });

    return config;
  });

  return config;
};

module.exports = withAndroidAssets;

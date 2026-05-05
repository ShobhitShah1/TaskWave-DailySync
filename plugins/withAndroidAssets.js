const {
  withDangerousMod,
  withAndroidManifest,
  withAppBuildGradle,
} = require('@expo/config-plugins');
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

  // 3. Copy Native Alarm Assets
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName = config.android.package || 'com.taskwave.dailysync';
      const packagePath = packageName.replace(/\./g, '/');
      const destJavaDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        packagePath,
      );

      // Copy all Kotlin template files
      const kotlinFiles = [
        'AlarmActivity.kt',
        'AlarmLauncherModule.kt',
        'AlarmLauncherPackage.kt',
        'AlarmMessagingService.kt',
        'AlarmService.kt',
      ];
      const javaTemplateDir = path.join(config.modRequest.projectRoot, 'native-templates', 'java');

      kotlinFiles.forEach((fileName) => {
        const templatePath = path.join(javaTemplateDir, fileName);
        if (fs.existsSync(templatePath)) {
          if (!fs.existsSync(destJavaDir)) {
            fs.mkdirSync(destJavaDir, { recursive: true });
          }
          let content = fs.readFileSync(templatePath, 'utf8');
          content = content.replace(/\{\{PACKAGE_NAME\}\}/g, packageName);
          fs.writeFileSync(path.join(destJavaDir, fileName), content);
        }
      });

      // Copy layout XML
      const layoutTemplatePath = path.join(
        config.modRequest.projectRoot,
        'native-templates',
        'layout',
        'activity_alarm.xml',
      );
      const destLayoutDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'layout',
      );
      const destLayoutPath = path.join(destLayoutDir, 'activity_alarm.xml');

      if (fs.existsSync(layoutTemplatePath)) {
        if (!fs.existsSync(destLayoutDir)) {
          fs.mkdirSync(destLayoutDir, { recursive: true });
        }
        fs.copyFileSync(layoutTemplatePath, destLayoutPath);
      }

      // Copy drawable XMLs
      const drawableTemplateDir = path.join(
        config.modRequest.projectRoot,
        'native-templates',
        'drawable',
      );
      const destDrawableDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'drawable',
      );

      if (fs.existsSync(drawableTemplateDir)) {
        if (!fs.existsSync(destDrawableDir)) {
          fs.mkdirSync(destDrawableDir, { recursive: true });
        }
        const drawables = fs.readdirSync(drawableTemplateDir);
        drawables.forEach((file) => {
          fs.copyFileSync(path.join(drawableTemplateDir, file), path.join(destDrawableDir, file));
        });
      }

      // Register AlarmLauncherPackage in MainApplication.kt
      const mainAppPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        packagePath,
        'MainApplication.kt',
      );
      if (fs.existsSync(mainAppPath)) {
        let mainAppContent = fs.readFileSync(mainAppPath, 'utf8');

        // Ensure the package is imported if needed (though it's in the same package)
        // But adding the package registration more robustly:
        const marker = 'PackageList(this).packages.apply {';
        if (mainAppContent.includes(marker) && !mainAppContent.includes('AlarmLauncherPackage')) {
          mainAppContent = mainAppContent.replace(
            marker,
            marker + '\n              add(AlarmLauncherPackage())',
          );
          fs.writeFileSync(mainAppPath, mainAppContent);
        }
      }

      // Update MainActivity.kt to handle onNewIntent
      const mainActivityPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        packagePath,
        'MainActivity.kt',
      );
      if (fs.existsSync(mainActivityPath)) {
        let mainActivityContent = fs.readFileSync(mainActivityPath, 'utf8');
        if (!mainActivityContent.includes('override fun onNewIntent')) {
          const onNewIntentMethod = `
  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    setIntent(intent)
  }
`;
          // Find a good place to insert - after getMainComponentName
          const insertionPoint = 'override fun getMainComponentName(): String = "main"';
          if (mainActivityContent.includes(insertionPoint)) {
            mainActivityContent = mainActivityContent.replace(
              insertionPoint,
              insertionPoint + '\n' + onNewIntentMethod,
            );

            // Also ensure Intent is imported
            if (!mainActivityContent.includes('import android.content.Intent')) {
              mainActivityContent = mainActivityContent.replace(
                'package ' + packageName,
                'package ' + packageName + '\nimport android.content.Intent',
              );
            }

            fs.writeFileSync(mainActivityPath, mainActivityContent);
          }
        }
      }

      return config;
    },
  ]);

  // 4. Update AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const mainApplication = androidManifest.application[0];
    const packageName = config.android.package || 'com.taskwave.dailysync';

    // Add necessary permissions
    const permissions = [
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      'android.permission.INTERNET',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.READ_CONTACTS',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.USE_FULL_SCREEN_INTENT',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
      'android.permission.WRITE_CONTACTS',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ];

    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    permissions.forEach((permission) => {
      const exists = androidManifest['uses-permission'].some(
        (p) => p.$['android:name'] === permission,
      );
      if (!exists) {
        androidManifest['uses-permission'].push({ $: { 'android:name': permission } });
      }
    });

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

    // Add AlarmActivity
    const alarmActivity = {
      $: {
        'android:name': `${packageName}.AlarmActivity`,
        'android:theme': '@android:style/Theme.DeviceDefault.NoActionBar',
        'android:showOnLockScreen': 'true',
        'android:showWhenLocked': 'true',
        'android:turnScreenOn': 'true',
        'android:excludeFromRecents': 'true',
        'android:launchMode': 'singleInstance',
        'android:taskAffinity': '',
        'android:exported': 'false',
        'android:directBootAware': 'true',
        'android:screenOrientation': 'portrait',
        'android:windowSoftInputMode': 'adjustResize',
      },
    };

    // Add AlarmMessagingService and AlarmService
    const alarmMessagingService = {
      $: {
        'android:name': `${packageName}.AlarmMessagingService`,
        'android:exported': 'false',
      },
      'intent-filter': [
        {
          action: [
            {
              $: { 'android:name': 'com.google.firebase.MESSAGING_EVENT' },
            },
          ],
        },
      ],
    };

    const alarmService = {
      $: {
        'android:name': `${packageName}.AlarmService`,
        'android:foregroundServiceType': 'specialUse',
        'android:exported': 'false',
      },
      property: [
        {
          $: {
            'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
            'android:value': 'alarm',
          },
        },
      ],
    };

    // Check if activity already exists
    const activityExists = mainApplication.activity?.some(
      (activity) => activity.$ && activity.$['android:name'] === `${packageName}.AlarmActivity`,
    );

    if (!activityExists) {
      if (!mainApplication.activity) {
        mainApplication.activity = [];
      }
      mainApplication.activity.push(alarmActivity);
    }

    // Inject services
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const messagingServiceExists = mainApplication.service.some(
      (s) => s.$ && s.$['android:name'] === `${packageName}.AlarmMessagingService`,
    );
    if (!messagingServiceExists) {
      mainApplication.service.push(alarmMessagingService);
    }

    const foregroundServiceExists = mainApplication.service.some(
      (s) => s.$ && s.$['android:name'] === `${packageName}.AlarmService`,
    );
    if (!foregroundServiceExists) {
      mainApplication.service.push(alarmService);
    }

    return config;
  });

  // 5. Add Firebase Messaging dependency to build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('com.google.firebase:firebase-messaging')) {
      return config;
    }

    const dependency = '\n    implementation("com.google.firebase:firebase-messaging:23.4.0")';
    config.modResults.contents = config.modResults.contents.replace(
      /dependencies\s*\{/,
      `dependencies {${dependency}`,
    );

    return config;
  });

  return config;
};

module.exports = withAndroidAssets;

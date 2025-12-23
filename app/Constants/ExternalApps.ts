import { Platform } from 'react-native';

export const EXTERNAL_APPS = {
  whatsapp: {
    packageName: 'com.whatsapp',
    storeUrl:
      Platform.OS === 'android'
        ? 'https://play.google.com/store/apps/details?id=com.whatsapp'
        : 'https://apps.apple.com/app/whatsapp-messenger/id310633997',
    appName: 'WhatsApp',
  },
  whatsappBusiness: {
    packageName: 'com.whatsapp.w4b',
    storeUrl:
      Platform.OS === 'android'
        ? 'https://play.google.com/store/apps/details?id=com.whatsapp.w4b'
        : 'https://apps.apple.com/app/whatsapp-business/id1386412985',
    appName: 'WhatsApp Business',
  },
  instagram: {
    packageName: 'com.instagram.android',
    storeUrl:
      Platform.OS === 'android'
        ? 'https://play.google.com/store/apps/details?id=com.instagram.android'
        : 'https://apps.apple.com/us/app/instagram/id389801252',
    appName: 'Instagram',
  },
  telegram: {
    packageName: 'org.telegram.messenger',
    storeUrl:
      Platform.OS === 'android'
        ? 'https://play.google.com/store/apps/details?id=org.telegram.messenger'
        : 'https://apps.apple.com/app/telegram-messenger/id686449807',
    appName: 'Telegram',
  },
};

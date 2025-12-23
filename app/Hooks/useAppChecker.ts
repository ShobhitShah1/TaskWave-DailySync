import { useCallback } from 'react';
import { Linking } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { isAppInstalled } from 'send-message';
import { useNavigation } from '@react-navigation/native';
import { NotificationType } from '@Types/Interface';
import { EXTERNAL_APPS } from '@Constants/ExternalApps';

export const useAppChecker = () => {
  const navigation = useNavigation();

  const checkAppAndNavigate = useCallback(
    async (
      appKey: keyof typeof EXTERNAL_APPS,
      notificationType: NotificationType,
      onCloseSheet: () => void,
    ) => {
      const appConfig = EXTERNAL_APPS[appKey];
      if (!appConfig) return;

      try {
        const result = await isAppInstalled(appConfig.packageName);

        if (result) {
          onCloseSheet();
          setTimeout(() => {
            navigation.navigate('CreateReminder', {
              notificationType,
            });
          }, 200);
        } else {
          showMessage({
            type: 'warning',
            message: `${appConfig.appName} is not installed`,
            description: 'Click here to install application',
            onPress: () => Linking.openURL(appConfig.storeUrl),
          });
        }
      } catch (error) {
        showMessage({
          type: 'danger',
          message: `${appConfig.appName} is not installed`,
        });
      }
    },
    [navigation],
  );

  return { checkAppAndNavigate };
};

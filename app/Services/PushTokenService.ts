import { getMessaging } from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { authApi } from '@Services/AuthService';
import { ensureRemoteNotificationChannel } from '@Services/RemoteNotificationService';
import { DeviceRegistrationInput } from '@Types/Auth';
import { Platform } from 'react-native';

const getTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const getRegistrationPayload = async (): Promise<DeviceRegistrationInput | null> => {
  await ensureRemoteNotificationChannel();

  if (Platform.OS === 'ios') {
    await getMessaging().registerDeviceForRemoteMessages();
    await getMessaging().requestPermission();
  } else {
    await notifee.requestPermission();
  }

  const fcmToken = await getMessaging().getToken();

  if (!fcmToken) {
    return null;
  }

  return {
    fcmToken,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    timezone: getTimezone(),
  };
};

export const syncPushToken = async (serverToken?: string | null): Promise<string | null> => {
  const payload = await getRegistrationPayload();

  if (!payload) {
    return null;
  }

  if (serverToken && payload.fcmToken === serverToken) {
    return null;
  }

  await authApi.registerDevice(payload);
  return payload.fcmToken;
};

export const subscribeToPushTokenRefresh = (onRefresh?: (newToken: string) => void) => {
  return getMessaging().onTokenRefresh(async (fcmToken) => {
    if (!fcmToken) {
      return;
    }

    await authApi.registerDevice({
      fcmToken,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      timezone: getTimezone(),
    });

    onRefresh?.(fcmToken);
  });
};

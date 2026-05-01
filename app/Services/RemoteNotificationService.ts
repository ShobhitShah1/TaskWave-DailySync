import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import notifee, { AndroidCategory, AndroidImportance } from '@notifee/react-native';
import { sounds } from '@Constants/Data';
import { ensureAlarmChannels } from './AlarmNotificationService';

const REMOTE_NOTIFICATION_CHANNEL_ID = 'daily-sync-remote';

export const ensureRemoteNotificationChannel = async () => {
  await notifee.createChannel({
    id: REMOTE_NOTIFICATION_CHANNEL_ID,
    name: 'DailySync Remote',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [1200, 800, 1200, 800],
  });
};

const getChannelIdForTone = (tone?: string) => {
  if (!tone) return REMOTE_NOTIFICATION_CHANNEL_ID;
  const sound = sounds.find((s) => s.name === tone || s.soundKeyName === tone);
  return sound ? `alarm-${sound.soundKeyName}` : REMOTE_NOTIFICATION_CHANNEL_ID;
};

const readTextValue = (value: unknown, fallback: string) => {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

const buildNotificationBody = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  const title = readTextValue(
    remoteMessage.notification?.title,
    readTextValue(remoteMessage.data?.title, 'DailySync'),
  );
  const body = readTextValue(
    remoteMessage.notification?.body,
    readTextValue(remoteMessage.data?.body, 'You have a new notification.'),
  );
  const data = Object.fromEntries(
    Object.entries(remoteMessage.data || {}).map(([key, value]) => [key, String(value)]),
  );

  return {
    title,
    body,
    data,
  };
};

export const displayRemoteNotification = async (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
) => {
  const notification = buildNotificationBody(remoteMessage);
  const isAlarm = notification.data.kind === 'alarm';

  await ensureRemoteNotificationChannel();

  if (isAlarm) {
    await ensureAlarmChannels();
    const tone = notification.data.tone;
    const vibrate = notification.data.vibrate === 'true';
    const channelId = getChannelIdForTone(tone);

    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      android: {
        channelId,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        autoCancel: false,
        ongoing: true,
        loopSound: true,
        fullScreenAction: {
          id: 'default',
        },
        pressAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          {
            title: 'Dismiss',
            pressAction: { id: 'dismiss-alarm' },
          },
          {
            title: 'Snooze',
            pressAction: { id: 'snooze-alarm' },
          },
        ],
        vibrationPattern: vibrate ? [500, 500, 500, 500] : undefined,
      },
    });
  } else {
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      android: {
        channelId: REMOTE_NOTIFICATION_CHANNEL_ID,
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
        sound: 'default',
      },
    });
  }
};

export const subscribeToForegroundRemoteMessages = (
  onMessageHandled?: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void,
) => {
  return messaging().onMessage(async (remoteMessage) => {
    await displayRemoteNotification(remoteMessage);
    onMessageHandled?.(remoteMessage);
  });
};

export const registerBackgroundRemoteMessages = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    await displayRemoteNotification(remoteMessage);
  });
};

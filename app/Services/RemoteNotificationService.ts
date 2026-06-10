import { NativeModules, Platform } from 'react-native';
import notifee, { AndroidCategory, AndroidImportance, AndroidStyle } from '@notifee/react-native';
import { FirebaseMessagingTypes, getMessaging } from '@react-native-firebase/messaging';
import { appQueryClient } from './QueryClient';

const REMOTE_NOTIFICATION_CHANNEL_ID = 'daily-sync-remote';
const PRIORITY_NOTIFICATION_CHANNEL_ID = 'daily-sync-priority';
const ALARM_FULLSCREEN_CHANNEL_ID = 'daily-sync-alarm-fullscreen';

export const launchNativeAlarm = async ({
  title,
  body,
  alarmId,
  mode,
  tone,
  bufferMinutes,
  alarmNotes,
  snoozeNoteIndex,
}: {
  title: string;
  body: string;
  alarmId: string;
  mode: string;
  tone: string;
  bufferMinutes: string;
  alarmNotes: string;
  snoozeNoteIndex: string;
}) => {
  const launcher = NativeModules.AlarmLauncher;

  if (!launcher?.launch) {
    throw new Error(
      'Native alarm launcher is unavailable. Rebuild the Android app after prebuild.',
    );
  }

  launcher.launch(title, body, alarmId, mode, tone, bufferMinutes, alarmNotes, snoozeNoteIndex);
};

export const stopNativeAlarm = () => {
  const launcher = NativeModules.AlarmLauncher;
  if (launcher?.stopService) {
    launcher.stopService();
  }
};

export const ensureRemoteNotificationChannel = async () => {
  await notifee.createChannel({
    id: REMOTE_NOTIFICATION_CHANNEL_ID,
    name: 'DailySync Remote',
    importance: AndroidImportance.HIGH,
    badge: true,
    lights: true,
  });

  await notifee.createChannel({
    id: PRIORITY_NOTIFICATION_CHANNEL_ID,
    name: 'DailySync Priority',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  // Dedicated channel for alarm full-screen intents
  await notifee.createChannel({
    id: ALARM_FULLSCREEN_CHANNEL_ID,
    name: 'DailySync Alarm',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [1200, 800, 1200, 800],
    bypassDnd: true,
    visibility: 1,
    badge: true,
    lights: true,
  });
};

const readTextValue = (value: unknown, fallback: string) => {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

const processedMessages = new Set<string>();

const buildNotificationBody = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  const title = readTextValue(
    remoteMessage.notification?.title,
    readTextValue(remoteMessage.data?.title, 'DailySync'),
  );
  const body = readTextValue(
    remoteMessage.notification?.body,
    readTextValue(
      remoteMessage.data?.body,
      readTextValue(
        remoteMessage.data?.message,
        readTextValue(remoteMessage.data?.subject, 'Wake up!'),
      ),
    ),
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
  const messageId = remoteMessage.messageId;

  if (messageId) {
    if (processedMessages.has(messageId)) {
      console.log(`[RemoteNotification] Message ${messageId} already processed, skipping.`);
      return;
    }
    processedMessages.add(messageId);
    // Keep set size small
    if (processedMessages.size > 50) {
      const firstItem = processedMessages.values().next().value;
      if (firstItem) processedMessages.delete(firstItem);
    }
  }

  const notification = buildNotificationBody(remoteMessage);
  console.log(
    `[RemoteNotification] 📩 Received data: ${JSON.stringify(notification.data, null, 2)}`,
  );
  const isAlarm = notification.data.kind === 'alarm';

  if (notification.data.kind === 'alarm-session-update' && notification.data.alarmId) {
    await Promise.all([
      appQueryClient.invalidateQueries({
        queryKey: ['alarms', 'session', notification.data.alarmId],
      }),
      appQueryClient.invalidateQueries({
        queryKey: ['alarms', 'group-feed'],
      }),
    ]);
  }

  if (isAlarm && Platform.OS === 'android') {
    await launchNativeAlarm({
      title: notification.title,
      body: notification.body,
      alarmId: readTextValue(notification.data.alarmId, messageId || `alarm-${Date.now()}`),
      mode: readTextValue(notification.data.mode, 'solo'),
      tone: readTextValue(notification.data.tone, 'default'),
      bufferMinutes: readTextValue(notification.data.bufferMinutes, '5'),
      alarmNotes: readTextValue(
        notification.data.alarmNotes,
        readTextValue(notification.data.alarm_notes, '[]'),
      ),
      snoozeNoteIndex: readTextValue(
        notification.data.snoozeNoteIndex,
        readTextValue(notification.data.snooze_note_index, '0'),
      ),
    });
    return;
  }

  await ensureRemoteNotificationChannel();

  if (notification.data.kind === 'alarm-invitation') {
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      android: {
        channelId: PRIORITY_NOTIFICATION_CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        style: {
          type: AndroidStyle.BIGTEXT,
          text: notification.body,
        },
        fullScreenAction: {
          id: 'default',
        },
        pressAction: { id: 'default' },
        actions: [
          {
            title: 'Accept',
            pressAction: { id: 'accept-invitation' },
          },
          {
            title: 'Decline',
            pressAction: { id: 'decline-invitation' },
          },
        ],
      },
    });
  } else if (notification.data.kind === 'alarm-session-update') {
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      android: {
        channelId: REMOTE_NOTIFICATION_CHANNEL_ID,
        pressAction: { id: 'open-alarm-session' },
        importance: AndroidImportance.HIGH,
        autoCancel: true,
        style: {
          type: AndroidStyle.BIGTEXT,
          text: notification.body,
        },
        sound: 'default',
      },
    });
  } else {
    // Default persistent notification example
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      android: {
        channelId: REMOTE_NOTIFICATION_CHANNEL_ID,
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
        ongoing: true, // Stays and won't remove on slide
        autoCancel: false, // Won't remove when pressed
        style: {
          type: AndroidStyle.BIGTEXT,
          text: notification.body, // Expandable by default
        },
        sound: 'default',
        actions: [
          {
            title: 'Cancel',
            pressAction: { id: 'cancel-notification' },
          },
        ],
      },
    });
  }
};

/**
 * Test full-screen alarm notification locally (no Firebase needed).
 * Call this from a button in the app to verify the AlarmActivity launches.
 */
export const testFullScreenAlarm = async () => {
  await ensureRemoteNotificationChannel();

  console.log('[TEST] Triggering full-screen alarm notification...');

  const testTitle = 'Test Alarm';
  const testBody = 'This is a test full-screen alarm!';
  const testAlarmId = `test-alarm-${Date.now()}`;

  if (Platform.OS === 'android') {
    await launchNativeAlarm({
      title: testTitle,
      body: testBody,
      alarmId: testAlarmId,
      mode: 'solo',
      tone: 'ting_tong', // Test with a specific custom tone
      bufferMinutes: '5',
      alarmNotes: '[]',
      snoozeNoteIndex: '1',
    });
    return;
  }

  console.log('[TEST] Notification displayed. Lock your screen to see full-screen intent.');
};

export const subscribeToForegroundRemoteMessages = (
  onMessageHandled?: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void,
) => {
  return getMessaging().onMessage(async (remoteMessage) => {
    await displayRemoteNotification(remoteMessage);
    onMessageHandled?.(remoteMessage);
  });
};

export const registerBackgroundRemoteMessages = () => {
  getMessaging().setBackgroundMessageHandler(async (remoteMessage) => {
    await displayRemoteNotification(remoteMessage);
  });
};

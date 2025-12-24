import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

import { sounds } from '@Constants/Data';
import { storage } from '@Contexts/ThemeProvider';
import { Notification } from '@Types/Interface';
import { getNotificationTitleAndBody } from './getNotificationTitleAndBody';

export const CHANNEL_NAME = 'Reminder';

/**
 * Check if the app can schedule exact alarms (Android 12+)
 * Returns true on iOS or if permission is granted on Android
 */
export const canScheduleExactAlarms = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const settings = await notifee.getNotificationSettings();
    // On Android 12+, we need to check if exact alarms are allowed
    return settings.android.alarm === 1; // 1 = ENABLED
  } catch (error) {
    console.error('[Notification] Error checking exact alarm permission:', error);
    return false;
  }
};

/**
 * Request exact alarm permission by opening system settings
 * User must manually enable "Alarms & reminders" permission
 */
export const requestExactAlarmPermission = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    await notifee.openAlarmPermissionSettings();
  } catch (error) {
    console.error('[Notification] Error opening alarm permission settings:', error);
  }
};

/**
 * Check and ensure exact alarm permission is granted
 * Returns true if permission is granted, false if user needs to grant it
 */
export const ensureExactAlarmPermission = async (): Promise<boolean> => {
  const canSchedule = await canScheduleExactAlarms();

  if (!canSchedule) {
    console.warn(
      '[Notification] Exact alarm permission not granted. Notifications may be delayed.',
    );
    // Optionally open settings - but this should be done from UI with user interaction
    // await requestExactAlarmPermission();
    return false;
  }

  return true;
};

export const createNotificationChannelIfNeeded = async () => {
  try {
    // Check exact alarm permission on Android 12+
    await ensureExactAlarmPermission();

    const channelId = storage.getString('notificationSound');
    if (!channelId) {
      storage.set('notificationSound', 'default');
    }
    await Promise.all(
      sounds.map(async (notification) => {
        await notifee.createChannel({
          id: notification?.soundKeyName,
          name: CHANNEL_NAME + ' ' + notification.soundKeyName?.toLocaleUpperCase(),
          visibility: AndroidVisibility.PUBLIC,
          importance: AndroidImportance.HIGH,
          sound: notification?.soundKeyName,
        });
      }),
    );
  } catch (error: any) {
    if (!error.message?.toString()?.includes('invalid notification ID')) {
      throw error;
    }
  }
};

export const buildTimestampTrigger = (date: Date, scheduleFrequency?: string): TimestampTrigger => {
  return {
    type: TriggerType.TIMESTAMP,
    timestamp: date.getTime(),
    repeatFrequency:
      scheduleFrequency === 'Daily'
        ? RepeatFrequency.DAILY
        : scheduleFrequency === 'Weekly'
          ? RepeatFrequency.WEEKLY
          : undefined,
    alarmManager: {
      type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
    },
  };
};

export const buildNotifeeNotification = (
  notification: Notification,
  channelId: string | null | undefined,
) => {
  const safeChannelId = channelId || 'default';
  const imageAttachment = notification.attachments?.find((attachment) =>
    attachment.type?.startsWith('image/'),
  );
  const { title, body } = getNotificationTitleAndBody(notification);
  return {
    title,
    body,
    android: {
      channelId: safeChannelId,
      sound: safeChannelId,
      visibility: AndroidVisibility.PUBLIC,
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
      ...(imageAttachment?.uri && {
        style: {
          type: AndroidStyle.BIGPICTURE,
          picture: imageAttachment?.uri || '',
        },
      }),
    },
  };
};

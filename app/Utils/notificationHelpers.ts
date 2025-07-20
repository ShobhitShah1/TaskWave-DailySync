import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

import { sounds } from '@Constants/Data';
import { storage } from '@Contexts/ThemeProvider';
import { Notification } from '@Types/Interface';
import { getNotificationTitleAndBody } from './getNotificationTitleAndBody';

export const CHANNEL_NAME = 'Reminder';

export const createNotificationChannelIfNeeded = async () => {
  try {
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
  notificationDate: Date,
  rescheduleInfoString?: string,
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

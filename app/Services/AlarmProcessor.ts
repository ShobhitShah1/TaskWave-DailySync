import notifee, { EventType, Notification, TimestampTrigger, TriggerType } from '@notifee/react-native';
import { alarmApi } from '@Services/AlarmApi';
import { updateSoloAlarmStatus, getSoloAlarmById } from '@Utils/alarmDatabase';
import {
  clearGroupAlarmSnooze,
  setGroupAlarmSnooze,
} from '@Utils/groupAlarmSnoozeStorage';
import { scheduleSoloAlarmNotification } from '@Services/AlarmNotificationService';
import { AlarmRepeat } from '@Types/Alarm';

export const handleAlarmEvent = async (type: EventType, detail: { notification?: Notification; pressAction?: { id: string } }) => {
  const { notification, pressAction } = detail;
  if (!notification?.data || notification.data.kind !== 'alarm') return;

  const alarmId = notification.data.alarmId as string;
  const mode = notification.data.mode as 'solo' | 'group';

  if (type === EventType.DELIVERED) {
    console.log(`[AlarmProcessor] Alarm delivered: ${alarmId}`);
    if (mode === 'group') {
      clearGroupAlarmSnooze(alarmId);
    }
    if (mode === 'solo') {
      const repeat = notification.data.repeat as AlarmRepeat;
      
      if (repeat === 'none') {
        await updateSoloAlarmStatus(alarmId, 'completed');
      } else {
        // Recurring alarm: schedule next instance
        const alarm = await getSoloAlarmById(alarmId);
        if (alarm) {
          const { nextTriggerAt } = await scheduleSoloAlarmNotification(alarmId, {
            title: alarm.title,
            note: alarm.note,
            hour: alarm.hour,
            minute: alarm.minute,
            meridiem: alarm.meridiem,
            tone: alarm.tone,
            vibrate: alarm.vibrate,
            bufferMinutes: alarm.bufferMinutes,
            repeat: alarm.repeat,
            repeatDays: alarm.repeatDays,
            snoozeDuration: alarm.snoozeDuration,
          });
          await updateSoloAlarmStatus(alarmId, 'scheduled', nextTriggerAt);
        }
      }
    }
  }

  if (type === EventType.ACTION_PRESS) {
    if (pressAction?.id === 'dismiss-alarm') {
      console.log(`[AlarmProcessor] Alarm dismissed: ${alarmId}`);
      if (mode === 'group') {
        clearGroupAlarmSnooze(alarmId);
        await alarmApi.recordAlarmAction(alarmId, 'dismiss').catch(() => undefined);
      }
      await notifee.cancelNotification(notification.id!);
    } else if (pressAction?.id === 'snooze-alarm') {
      console.log(`[AlarmProcessor] Alarm snoozed: ${alarmId}`);
      // Dynamic snooze: use snoozeDuration from data or default 5 mins
      const snoozeMinutes = parseInt(notification.data?.snoozeDuration as string || '5', 10) || 5;
      const snoozeTime = new Date(Date.now() + snoozeMinutes * 60 * 1000);
      if (mode === 'group') {
        setGroupAlarmSnooze(alarmId, snoozeTime.toISOString());
        await alarmApi.recordAlarmAction(alarmId, 'snooze', snoozeMinutes).catch(() => undefined);
      }
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: snoozeTime.getTime(),
        alarmManager: true,
      };

      await notifee.createTriggerNotification(
        {
          ...notification,
          id: `snooze-${alarmId}-${Date.now()}`,
          title: `[Snoozed] ${notification.title}`,
          data: {
            ...notification.data,
            status: 'snoozed',
          },
        },
        trigger
      );
      await notifee.cancelNotification(notification.id!);
      if (mode === 'solo') {
        await updateSoloAlarmStatus(alarmId, 'snoozed', snoozeTime.toISOString());
      }
    }
  }
};

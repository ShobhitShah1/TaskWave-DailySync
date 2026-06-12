import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  AndroidLaunchActivityFlag,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { CreateSoloAlarmInput } from '@Types/Alarm';
import { buildNextAlarmDate } from '@Utils/alarmSchedule';
import { NativeModules, Platform } from 'react-native';

import { sounds } from '@Constants/Data';

const getChannelIdForTone = (tone: string) => {
  const sound = sounds.find((s) => s.name === tone || s.soundKeyName === tone);
  return sound ? `alarm-${sound.soundKeyName}` : 'daily-sync-alarm';
};

export const ensureAlarmChannels = async () => {
  await Promise.all(
    sounds.map(async (sound) => {
      await notifee.createChannel({
        id: `alarm-${sound.soundKeyName}`,
        name: `Alarm (${sound.name})`,
        importance: AndroidImportance.HIGH,
        vibration: true,
        vibrationPattern: [1200, 800, 1200, 800],
        sound: undefined, // Handled by native AlarmService
        visibility: 1,
        bypassDnd: true,
      });
    }),
  );

  // Legacy default channel
  await notifee.createChannel({
    id: 'daily-sync-alarm',
    name: 'DailySync Alarm',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [1200, 800, 1200, 800],
    sound: undefined, // Handled by native AlarmService
    visibility: 1,
    bypassDnd: true,
  });
};

export const scheduleSoloAlarmNotification = async (
  alarmId: string,
  input: CreateSoloAlarmInput,
) => {
  const scheduledFor = buildNextAlarmDate(input);

  if (Platform.OS === 'android' && NativeModules.AlarmLauncher?.scheduleSoloAlarm) {
    await NativeModules.AlarmLauncher.scheduleSoloAlarm(
      alarmId,
      scheduledFor.getTime(),
      input.title || 'Alarm',
      input.note || 'It is time.',
      input.tone,
      (input.bufferMinutes || 5).toString(),
      JSON.stringify(input.alarmNotes ?? []),
      String(input.snoozeNoteIndex ?? 0),
    );

    return {
      notificationId: alarmId,
      nextTriggerAt: scheduledFor.toISOString(),
    };
  }

  await ensureAlarmChannels();
  const channelId = getChannelIdForTone(input.tone);
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: scheduledFor.getTime(),
    alarmManager: {
      type: AlarmType.SET_ALARM_CLOCK,
    },
  };

  const notificationId = await notifee.createTriggerNotification(
    {
      id: alarmId,
      title: input.title || 'Alarm',
      body: input.note || 'It is time.',
      android: {
        channelId: channelId,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        autoCancel: false,
        ongoing: true,
        loopSound: true,
        asForegroundService: true,
        fullScreenAction: {
          id: 'default',
          launchActivity: 'com.taskwave.dailysync.AlarmActivity',
          launchActivityFlags: [
            AndroidLaunchActivityFlag.NEW_TASK,
            AndroidLaunchActivityFlag.CLEAR_TOP,
          ],
        },
        pressAction: {
          id: 'default',
          launchActivity: 'com.taskwave.dailysync.AlarmActivity',
          launchActivityFlags: [
            AndroidLaunchActivityFlag.NEW_TASK,
            AndroidLaunchActivityFlag.CLEAR_TOP,
          ],
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
        vibrationPattern: input.vibrate ? [500, 500, 500, 500] : undefined,
      },
      data: {
        kind: 'alarm',
        alarmId,
        mode: 'solo',
        repeat: input.repeat,
        repeatDays: JSON.stringify(input.repeatDays),
        hour: String(input.hour),
        minute: String(input.minute),
        meridiem: input.meridiem,
        tone: input.tone,
        alarmNotes: JSON.stringify(input.alarmNotes ?? []),
        snoozeNoteIndex: '0',
        bufferMinutes: (input.bufferMinutes || 5).toString(),
      },
    },
    trigger,
  );

  return {
    notificationId,
    nextTriggerAt: scheduledFor.toISOString(),
  };
};

export const cancelSoloAlarmNotification = async (notificationId: string | null) => {
  if (!notificationId) {
    return;
  }

  if (Platform.OS === 'android' && NativeModules.AlarmLauncher?.cancelSoloAlarm) {
    NativeModules.AlarmLauncher.cancelSoloAlarm(notificationId);
  }

  await Promise.all([
    notifee.cancelNotification(notificationId).catch(() => undefined),
    notifee.cancelTriggerNotification(notificationId).catch(() => undefined),
  ]);
};

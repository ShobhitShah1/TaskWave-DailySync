import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidLaunchActivityFlag,
  EventType,
  Notification,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { alarmApi } from '@Services/AlarmApi';
import {
  ensureAlarmChannels,
  scheduleSoloAlarmNotification,
} from '@Services/AlarmNotificationService';
import { AlarmRepeat } from '@Types/Alarm';
import { getSoloAlarmById, updateSoloAlarmStatus } from '@Utils/alarmDatabase';
import { buildNextAlarmDate } from '@Utils/alarmSchedule';
import { clearGroupAlarmSnooze, setGroupAlarmSnooze } from '@Utils/groupAlarmSnoozeStorage';
import { NativeModules } from 'react-native';
import { appQueryClient } from './QueryClient';
import { launchNativeAlarm, stopNativeAlarm } from './RemoteNotificationService';
import { ALARM_QUERY_KEYS } from '@Hooks/useAlarm';

/**
 * Consolidated native alarm logic is now imported from RemoteNotificationService.
 */

/**
 * Cancel all notification artifacts for an alarm.
 */
const cancelAlarmNotifications = async (notificationId?: string, alarmId?: string) => {
  try {
    if (notificationId) {
      await notifee.cancelNotification(notificationId).catch(() => undefined);
    }
    if (alarmId && alarmId !== notificationId) {
      await notifee.cancelNotification(alarmId).catch(() => undefined);
    }
    await notifee.stopForegroundService().catch(() => undefined);
  } catch (e) {
    console.error('[AlarmProcessor] Error cancelling notifications:', e);
  }
};

/**
 * Invalidate all alarm-related queries so UI refreshes.
 */
const invalidateAlarmQueries = () => {
  appQueryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });
  appQueryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.solo });
};

export const handleAlarmEvent = async (
  type: EventType,
  detail: { notification?: Notification; pressAction?: { id: string } },
) => {
  const { notification, pressAction } = detail;
  if (!notification?.data) return;

  if (notification.data.kind === 'alarm-invitation') {
    const invitationId = notification.data.invitationId as string;

    if (type === EventType.ACTION_PRESS && invitationId) {
      if (pressAction?.id === 'accept-invitation') {
        console.log(`[AlarmProcessor] Invitation accepted: ${invitationId}`);
        await alarmApi.respondToInvitation(invitationId, 'accept').catch(console.error);
        await notifee.cancelNotification(notification.id!);
        invalidateAlarmQueries();
      } else if (pressAction?.id === 'decline-invitation') {
        console.log(`[AlarmProcessor] Invitation declined: ${invitationId}`);
        await alarmApi.respondToInvitation(invitationId, 'decline').catch(console.error);
        await notifee.cancelNotification(notification.id!);
        invalidateAlarmQueries();
      }
    }
    return;
  }

  if (notification.data.kind !== 'alarm') return;

  const alarmId =
    (notification.data?.alarmId as string) || notification.id || `alarm-${Date.now()}`;
  const mode = (notification.data?.mode as 'solo' | 'group') || 'solo';

  // ─── DELIVERED: Snooze trigger fired — launch native alarm ───
  if (type === EventType.DELIVERED) {
    console.log(`[AlarmProcessor] 📬 Alarm DELIVERED (trigger fired): ${alarmId}`);

    const launcher = NativeModules.AlarmLauncher;
    if (launcher?.launch) {
      const title = (notification.data?.title as string) || notification.title || 'Alarm';
      const body = (notification.data?.body as string) || notification.body || 'Wake up!';
      const baseTone = (notification.data?.tone as string) || 'default';
      const bufferMinutes = (notification.data?.bufferMinutes as string) || '5';

      // Read alarmNotes + snoozeNoteIndex from the DB (reliable source of truth)
      // The notification data can get overwritten by the native AlarmService
      let alarmNotes: string[] = [];
      let snoozeNoteIndex = 0;

      if (mode === 'solo') {
        const alarm = await getSoloAlarmById(alarmId);

        if (alarm) {
          alarmNotes = alarm.alarmNotes ?? [];
          snoozeNoteIndex = alarm.snoozeNoteIndex ?? 0;
        }
      } else {
        // Group alarms: read from notification data
        try {
          const notesStr = (notification.data?.alarmNotes ||
            notification.data?.alarm_notes) as string;
          alarmNotes = JSON.parse(notesStr || '[]');
        } catch {
          alarmNotes = [];
        }
        snoozeNoteIndex = parseInt(
          (notification.data?.snoozeNoteIndex ||
            notification.data?.snooze_note_index ||
            '0') as string,
          10,
        );
      }

      console.log(`[AlarmProcessor] 🔍 Full Data: ${JSON.stringify(notification.data, null, 2)}`);
      console.log('notification', JSON.stringify(notification, null, 2));

      // Index 0 = initial trigger → plays the main tone
      // Index >= 1 = snooze cycle → plays alarmNotes sequentially, cycling
      let toneToPlay = baseTone;
      if (snoozeNoteIndex > 0 && alarmNotes.length > 0) {
        const noteIdx = (snoozeNoteIndex - 1) % alarmNotes.length;
        toneToPlay = alarmNotes[noteIdx];
      }

      console.log(
        `[AlarmProcessor] 🎵 Playing tone: ${toneToPlay} (snoozeIndex=${snoozeNoteIndex}, notes=${alarmNotes.length})`,
      );
      await launchNativeAlarm({
        title,
        body,
        alarmId,
        mode,
        tone: toneToPlay || baseTone,
        bufferMinutes: (notification.data?.bufferMinutes || '5') as string,
        alarmNotes: JSON.stringify(alarmNotes),
        snoozeNoteIndex: String(snoozeNoteIndex),
      });
    }
    return;
  }

  // ─── DISMISSED: User swiped away the notification ───
  if (type === EventType.DISMISSED) {
    console.log(`[AlarmProcessor] 🗑️ Alarm notification dismissed (swiped): ${alarmId}`);

    stopNativeAlarm();
    await cancelAlarmNotifications(notification.id!, alarmId);

    // Cancel any pending snooze triggers for this alarm
    await notifee.cancelTriggerNotification(alarmId).catch(() => undefined);

    if (mode === 'group') {
      clearGroupAlarmSnooze(alarmId);
    } else {
      // Recalculate next trigger for the solo alarm
      const alarm = await getSoloAlarmById(alarmId);
      if (alarm) {
        const nextDate = buildNextAlarmDate(alarm);
        await updateSoloAlarmStatus(alarmId, 'scheduled', undefined, nextDate.toISOString());
      } else {
        await updateSoloAlarmStatus(alarmId, 'scheduled').catch(() => undefined);
      }
    }

    alarmApi.recordAlarmAction(alarmId, 'dismiss').catch(() => undefined);
    invalidateAlarmQueries();
    return;
  }

  if (type === EventType.ACTION_PRESS) {
    // Stop the native alarm service regardless of action
    stopNativeAlarm();

    if (pressAction?.id === 'dismiss-alarm') {
      console.log(`[AlarmProcessor] 🛑 Alarm dismissed: ${alarmId}`);

      try {
        // Cancel all potential notification IDs for this alarm
        await cancelAlarmNotifications(notification.id!, alarmId);

        // Cancel any pending snooze triggers
        await notifee.cancelTriggerNotification(alarmId).catch(() => undefined);

        // Sync with API
        await alarmApi.recordAlarmAction(alarmId, 'dismiss').catch(() => undefined);

        if (mode === 'group') {
          clearGroupAlarmSnooze(alarmId);
        } else {
          // Solo alarm dismissal — recalculate next trigger
          const alarm = await getSoloAlarmById(alarmId);
          if (alarm) {
            const repeat = alarm.repeat as AlarmRepeat;
            if (repeat !== 'none' || (alarm.repeatDays && alarm.repeatDays.length > 0)) {
              // Recurring: schedule next occurrence and update DB
              const result = await scheduleSoloAlarmNotification(alarmId, alarm);
              await updateSoloAlarmStatus(alarmId, 'scheduled', undefined, result.nextTriggerAt);
            } else {
              // One-time: recalculate next date (tomorrow at same time)
              const nextDate = buildNextAlarmDate(alarm);
              await updateSoloAlarmStatus(alarmId, 'scheduled', undefined, nextDate.toISOString());
            }
          }
        }

        // Invalidate queries to update UI
        invalidateAlarmQueries();
        console.log(`[AlarmProcessor] ✅ Dismissal complete.`);
      } catch (err) {
        console.error(`[AlarmProcessor] ❌ Error during dismissal:`, err);
      }
    } else if (pressAction?.id === 'snooze-alarm') {
      console.log(`[AlarmProcessor] 🔔 Snooze triggered for alarmId: ${alarmId}`);

      const bufferVal = notification.data?.bufferMinutes as string;
      const snoozeMinutes = bufferVal !== undefined ? parseInt(bufferVal, 10) : 5;
      const snoozeTime = new Date(Date.now() + Math.max(snoozeMinutes, 1) * 60 * 1000);

      try {
        // Clean the title (remove existing [SNOOZED] prefix if present)
        const rawTitle = (notification.data?.title as string) || notification.title || 'Alarm';
        const cleanTitle = rawTitle.replace(/^\[SNOOZED\]\s*/, '');
        const originalBody = (notification.data?.body as string) || notification.body || 'Wake up!';
        const tone = (notification.data?.tone as string) || 'default';

        // Read alarmNotes + snoozeNoteIndex from DB (source of truth for solo alarms)
        // Notification data may have been overwritten by native AlarmService
        let alarmNotes: string[] = [];
        let currentSnoozeIndex = 0;

        if (mode === 'solo') {
          const alarm = await getSoloAlarmById(alarmId);
          if (alarm) {
            alarmNotes = alarm.alarmNotes ?? [];
            currentSnoozeIndex = alarm.snoozeNoteIndex ?? 0;
          }
        } else {
          // Group alarms: read from notification data
          try {
            const notesStr = (notification.data?.alarmNotes ||
              notification.data?.alarm_notes) as string;
            alarmNotes = JSON.parse(notesStr || '[]');
          } catch {
            alarmNotes = [];
          }
          currentSnoozeIndex = parseInt(
            (notification.data?.snoozeNoteIndex ||
              notification.data?.snooze_note_index ||
              '0') as string,
            10,
          );
        }
        const nextSnoozeIndex = currentSnoozeIndex + 1;

        // 1. Local State Management (UI updates)
        if (mode === 'group') {
          setGroupAlarmSnooze(alarmId, snoozeTime.toISOString());
        } else {
          await updateSoloAlarmStatus(
            alarmId,
            'snoozed',
            snoozeTime.toISOString(),
            undefined,
            nextSnoozeIndex,
          );
        }

        // 2. Tell API about the snooze
        alarmApi.recordAlarmAction(alarmId, 'snooze', snoozeMinutes).catch(() => undefined);

        // 3. Stop current ringing & cancel old notification
        await cancelAlarmNotifications(notification.id!, alarmId);

        // 4. Schedule LOCAL trigger for snooze re-ring
        // When this fires, the DELIVERED handler above will launch native AlarmService
        const snoozeTrigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: snoozeTime.getTime(),
          alarmManager: {
            type: AlarmType.SET_ALARM_CLOCK,
          },
        };

        const snoozeNotification = {
          title: `[SNOOZED] ${cleanTitle}`,
          body: `Snoozed until ${snoozeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          data: {
            kind: 'alarm',
            alarmId: alarmId,
            mode: mode,
            title: cleanTitle,
            body: originalBody,
            tone: alarmNotes[nextSnoozeIndex % alarmNotes.length] || tone,
            alarmNotes: JSON.stringify(alarmNotes),
            snoozeNoteIndex: String(nextSnoozeIndex),
            bufferMinutes: (snoozeMinutes || 5).toString(),
            status: 'snoozed',
          },
          android: {
            channelId: notification.android?.channelId || 'daily-sync-alarm',
            category: 'alarm' as any,
            importance: AndroidImportance.HIGH,
            ongoing: true,
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
          },
        };

        await ensureAlarmChannels();
        await notifee.createTriggerNotification(
          {
            ...snoozeNotification,
            id: alarmId,
          },
          snoozeTrigger,
        );

        // Invalidate queries to update UI with snooze state
        invalidateAlarmQueries();

        console.log(
          `[AlarmProcessor] ✅ Independent snooze scheduled for ${snoozeTime.toISOString()}`,
        );
      } catch (err) {
        console.error(`[AlarmProcessor] ❌ Fatal error in snooze logic:`, err);
      }
    }
  }
};

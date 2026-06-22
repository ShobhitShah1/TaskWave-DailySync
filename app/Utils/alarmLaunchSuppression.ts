import { MMKV } from 'react-native-mmkv';

const SUPPRESSION_PREFIX = 'alarmLaunchSuppressedUntil:';
const DISMISS_SUPPRESSION_MS = 90 * 1000;
const storage = new MMKV();

const getSuppressionKey = (alarmId: string) => `${SUPPRESSION_PREFIX}${alarmId}`;

export const suppressAlarmLaunchAfterDismiss = (alarmId?: string | null) => {
  if (!alarmId) return;

  storage.set(getSuppressionKey(alarmId), String(Date.now() + DISMISS_SUPPRESSION_MS));
};

export const isAlarmLaunchSuppressed = (alarmId?: string | null) => {
  if (!alarmId) return false;

  const key = getSuppressionKey(alarmId);
  const suppressedUntil = Number(storage.getString(key));

  if (!Number.isFinite(suppressedUntil)) {
    storage.delete(key);
    return false;
  }

  if (suppressedUntil > Date.now()) {
    return true;
  }

  storage.delete(key);
  return false;
};

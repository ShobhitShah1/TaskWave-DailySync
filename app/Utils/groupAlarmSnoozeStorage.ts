import { storage } from '@Contexts/ThemeProvider';

const GROUP_ALARM_SNOOZE_KEY = 'group_alarm_snoozes';

type GroupAlarmSnoozeMap = Record<string, string>;

const readSnoozeMap = (): GroupAlarmSnoozeMap => {
  try {
    const raw = storage.getString(GROUP_ALARM_SNOOZE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as GroupAlarmSnoozeMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeSnoozeMap = (value: GroupAlarmSnoozeMap) => {
  storage.set(GROUP_ALARM_SNOOZE_KEY, JSON.stringify(value));
};

export const getGroupAlarmSnooze = (alarmId: string) => {
  const value = readSnoozeMap()[alarmId];
  return value || null;
};

export const setGroupAlarmSnooze = (alarmId: string, snoozeUntil: string) => {
  const nextMap = readSnoozeMap();
  nextMap[alarmId] = snoozeUntil;
  writeSnoozeMap(nextMap);
};

export const clearGroupAlarmSnooze = (alarmId: string) => {
  const nextMap = readSnoozeMap();
  if (!nextMap[alarmId]) {
    return;
  }

  delete nextMap[alarmId];
  writeSnoozeMap(nextMap);
};

export const pruneExpiredGroupAlarmSnoozes = () => {
  const now = Date.now();
  const current = readSnoozeMap();
  const nextMap: GroupAlarmSnoozeMap = {};

  Object.entries(current).forEach(([alarmId, snoozeUntil]) => {
    if (new Date(snoozeUntil).getTime() > now) {
      nextMap[alarmId] = snoozeUntil;
    }
  });

  if (Object.keys(nextMap).length !== Object.keys(current).length) {
    writeSnoozeMap(nextMap);
  }

  return nextMap;
};

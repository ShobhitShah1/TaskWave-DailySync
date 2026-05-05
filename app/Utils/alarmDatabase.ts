import * as SQLite from 'expo-sqlite';

import { CreateSoloAlarmInput, SoloAlarmRecord } from '@Types/Alarm';
import {
  cancelSoloAlarmNotification,
  scheduleSoloAlarmNotification,
} from '@Services/AlarmNotificationService';

const createAlarmId = () => `solo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ALERTS_DATABASE_NAME = 'dailysync_alerts.db';
const LEGACY_ALARMS_DATABASE_NAME = 'alarms.db';
const PERSONAL_ALERTS_TABLE = 'personal_alerts';
const LEGACY_PERSONAL_ALERTS_TABLE = 'solo_alarms';

let alarmDatabaseInstance: SQLite.SQLiteDatabase | null = null;

const mapSoloAlarmRecord = (record: any): SoloAlarmRecord => ({
  id: record.id,
  mode: 'solo',
  title: record.title,
  note: record.note,
  hour: Number(record.hour),
  minute: Number(record.minute),
  meridiem: record.meridiem,
  tone: record.tone,
  bufferMinutes: Number(record.buffer_minutes),
  repeat: record.repeat_type,
  repeatDays: record.repeat_days ? JSON.parse(record.repeat_days) : [],
  nextTriggerAt: record.next_trigger_at,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
  status: record.status,
  snoozedUntil: record.snoozed_until || null,
  vibrate: Boolean(record.vibrate),
  memoUri: null,
  localNotificationId: record.local_notification_id,
});

export const getAlarmDatabase = async () => {
  if (alarmDatabaseInstance) {
    return alarmDatabaseInstance;
  }

  alarmDatabaseInstance = await SQLite.openDatabaseAsync(ALERTS_DATABASE_NAME, {
    useNewConnection: true,
  });

  await alarmDatabaseInstance.execAsync(`CREATE TABLE IF NOT EXISTS ${PERSONAL_ALERTS_TABLE} (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    note TEXT NOT NULL,
    hour INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    meridiem TEXT NOT NULL,
    tone TEXT NOT NULL,
    vibrate INTEGER NOT NULL DEFAULT 1,
    buffer_minutes INTEGER NOT NULL DEFAULT 0,
    repeat_type TEXT NOT NULL DEFAULT 'none',
    repeat_days TEXT NOT NULL DEFAULT '[]',
    snooze_duration INTEGER NOT NULL DEFAULT 5,
    next_trigger_at TEXT NOT NULL,
    local_notification_id TEXT,
    snoozed_until TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);

  // Migration: add snoozed_until column if missing
  const cols = await alarmDatabaseInstance.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${PERSONAL_ALERTS_TABLE})`,
  );
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has('snoozed_until')) {
    await alarmDatabaseInstance.execAsync(
      `ALTER TABLE ${PERSONAL_ALERTS_TABLE} ADD COLUMN snoozed_until TEXT`,
    );
  }

  await alarmDatabaseInstance.execAsync('PRAGMA journal_mode = WAL;');

  const columns = await alarmDatabaseInstance.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${PERSONAL_ALERTS_TABLE})`,
  );
  const columnNames = new Set(columns.map((column) => column.name));

  if (columnNames.has('memo_uri')) {
    await alarmDatabaseInstance.execAsync(`
      ALTER TABLE ${PERSONAL_ALERTS_TABLE} RENAME TO ${PERSONAL_ALERTS_TABLE}_legacy;

      CREATE TABLE ${PERSONAL_ALERTS_TABLE} (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        note TEXT NOT NULL,
        hour INTEGER NOT NULL,
        minute INTEGER NOT NULL,
        meridiem TEXT NOT NULL,
        tone TEXT NOT NULL,
        vibrate INTEGER NOT NULL DEFAULT 1,
        buffer_minutes INTEGER NOT NULL DEFAULT 0,
        repeat_type TEXT NOT NULL DEFAULT 'none',
        repeat_days TEXT NOT NULL DEFAULT '[]',
        snooze_duration INTEGER NOT NULL DEFAULT 5,
        next_trigger_at TEXT NOT NULL,
        local_notification_id TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      INSERT INTO ${PERSONAL_ALERTS_TABLE} (
        id, title, note, hour, minute, meridiem, tone, vibrate,
        buffer_minutes, repeat_type, repeat_days, snooze_duration,
        next_trigger_at, local_notification_id, status, created_at, updated_at
      )
      SELECT
        id, title, note, hour, minute, meridiem, tone, vibrate,
        buffer_minutes, repeat_type, repeat_days, COALESCE(snooze_duration, 5),
        next_trigger_at, local_notification_id, status, created_at, updated_at
      FROM ${PERSONAL_ALERTS_TABLE}_legacy;

      DROP TABLE ${PERSONAL_ALERTS_TABLE}_legacy;
    `);
  }

  const existingRows = await alarmDatabaseInstance.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM ${PERSONAL_ALERTS_TABLE}`,
  );

  if (!existingRows?.total) {
    const legacyDatabase = await SQLite.openDatabaseAsync(LEGACY_ALARMS_DATABASE_NAME, {
      useNewConnection: true,
    });

    const legacyTable = await legacyDatabase.getFirstAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
      [LEGACY_PERSONAL_ALERTS_TABLE],
    );

    if (legacyTable?.name) {
      const legacyRows = await legacyDatabase.getAllAsync<any>(
        `SELECT * FROM ${LEGACY_PERSONAL_ALERTS_TABLE}`,
      );

      for (const row of legacyRows) {
        await alarmDatabaseInstance.runAsync(
          `INSERT OR IGNORE INTO ${PERSONAL_ALERTS_TABLE} (
            id, title, note, hour, minute, meridiem, tone, vibrate,
            buffer_minutes, repeat_type, repeat_days,
            next_trigger_at, local_notification_id, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.id,
            row.title,
            row.note,
            row.hour,
            row.minute,
            row.meridiem,
            row.tone,
            row.vibrate,
            row.buffer_minutes,
            row.repeat_type,
            row.repeat_days,
            row.next_trigger_at,
            row.local_notification_id,
            row.status,
            row.created_at,
            row.updated_at,
          ],
        );
      }
    }
  }

  return alarmDatabaseInstance;
};

export const createSoloAlarm = async (input: CreateSoloAlarmInput) => {
  const database = await getAlarmDatabase();
  const id = createAlarmId();
  const timestamp = new Date().toISOString();
  const { notificationId, nextTriggerAt } = await scheduleSoloAlarmNotification(id, input);

  await database.runAsync(
    `INSERT INTO ${PERSONAL_ALERTS_TABLE} (
      id, title, note, hour, minute, meridiem, tone, vibrate,
      buffer_minutes, repeat_type, repeat_days, snooze_duration, next_trigger_at,
      local_notification_id, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title,
      input.note,
      input.hour,
      input.minute,
      input.meridiem,
      input.tone,
      input.vibrate ? 1 : 0,
      input.bufferMinutes,
      input.repeat,
      JSON.stringify(input.repeatDays),
      input.bufferMinutes || 5,
      nextTriggerAt,
      notificationId,
      'scheduled',
      timestamp,
      timestamp,
    ],
  );

  const record = await database.getFirstAsync(
    `SELECT * FROM ${PERSONAL_ALERTS_TABLE} WHERE id = ?`,
    [id],
  );
  return mapSoloAlarmRecord(record);
};

export const getSoloAlarms = async () => {
  const database = await getAlarmDatabase();
  const rows = await database.getAllAsync(
    `SELECT * FROM ${PERSONAL_ALERTS_TABLE} ORDER BY next_trigger_at ASC`,
  );
  return rows.map(mapSoloAlarmRecord);
};

export const getSoloAlarmById = async (alarmId: string) => {
  const database = await getAlarmDatabase();
  const row = await database.getFirstAsync(`SELECT * FROM ${PERSONAL_ALERTS_TABLE} WHERE id = ?`, [
    alarmId,
  ]);

  if (!row) {
    return null;
  }

  return mapSoloAlarmRecord(row);
};

export const deleteSoloAlarm = async (alarmId: string) => {
  const database = await getAlarmDatabase();
  const alarm = await getSoloAlarmById(alarmId);

  if (alarm) {
    await cancelSoloAlarmNotification(alarm.localNotificationId);
  }

  await database.runAsync(`DELETE FROM ${PERSONAL_ALERTS_TABLE} WHERE id = ?`, [alarmId]);
  return true;
};

export const updateSoloAlarm = async (alarmId: string, input: CreateSoloAlarmInput) => {
  const database = await getAlarmDatabase();
  const existingAlarm = await getSoloAlarmById(alarmId);

  if (!existingAlarm) {
    throw new Error('Alarm not found.');
  }

  await cancelSoloAlarmNotification(existingAlarm.localNotificationId);

  const timestamp = new Date().toISOString();
  const { notificationId, nextTriggerAt } = await scheduleSoloAlarmNotification(alarmId, input);

  await database.runAsync(
    `UPDATE ${PERSONAL_ALERTS_TABLE}
     SET title = ?, note = ?, hour = ?, minute = ?, meridiem = ?, tone = ?, vibrate = ?,
         buffer_minutes = ?, repeat_type = ?, repeat_days = ?, snooze_duration = ?,
         next_trigger_at = ?, local_notification_id = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.title,
      input.note,
      input.hour,
      input.minute,
      input.meridiem,
      input.tone,
      input.vibrate ? 1 : 0,
      input.bufferMinutes,
      input.repeat,
      JSON.stringify(input.repeatDays),
      input.bufferMinutes || 5,
      nextTriggerAt,
      notificationId,
      'scheduled',
      timestamp,
      alarmId,
    ],
  );

  const row = await database.getFirstAsync(`SELECT * FROM ${PERSONAL_ALERTS_TABLE} WHERE id = ?`, [
    alarmId,
  ]);
  return mapSoloAlarmRecord(row);
};

export const updateSoloAlarmStatus = async (
  alarmId: string,
  status: 'scheduled' | 'snoozed' | 'completed',
  snoozedUntil?: string,
  nextTriggerAt?: string,
) => {
  const database = await getAlarmDatabase();
  const timestamp = new Date().toISOString();

  if (status === 'snoozed' && snoozedUntil) {
    await database.runAsync(
      `UPDATE ${PERSONAL_ALERTS_TABLE} SET status = ?, snoozed_until = ?, next_trigger_at = ?, updated_at = ? WHERE id = ?`,
      [status, snoozedUntil, snoozedUntil, timestamp, alarmId],
    );
  } else if (nextTriggerAt) {
    // Dismiss with a recalculated next trigger time
    await database.runAsync(
      `UPDATE ${PERSONAL_ALERTS_TABLE} SET status = ?, snoozed_until = NULL, next_trigger_at = ?, updated_at = ? WHERE id = ?`,
      [status, nextTriggerAt, timestamp, alarmId],
    );
  } else {
    // Clear snoozed_until only
    await database.runAsync(
      `UPDATE ${PERSONAL_ALERTS_TABLE} SET status = ?, snoozed_until = NULL, updated_at = ? WHERE id = ?`,
      [status, timestamp, alarmId],
    );
  }
  return true;
};

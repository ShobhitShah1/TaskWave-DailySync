/* eslint-disable @typescript-eslint/no-explicit-any */
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { showMessage } from 'react-native-flash-message';

import { sounds } from '@Constants/Data';
import { storage } from '@Contexts/ThemeProvider';
import { Contact, Notification, RescheduleConfig, LocationReminderStatus } from '@Types/Interface';
import { executeWithRetry, getDatabase } from '@Utils/databaseUtils';
import {
  buildNotifeeNotification,
  buildTimestampTrigger,
  CHANNEL_NAME,
  createNotificationChannelIfNeeded,
} from '@Utils/notificationHelpers';
import { prepareNotificationData } from '@Utils/prepareNotificationData';

export const RESCHEDULE_CONFIG: RescheduleConfig = {
  defaultDelay: 1, // default 1 minutes
  maxRetries: 3, // optional: limit number of reschedules
};

export const createNotificationChannel = async () => {
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
      showMessage({
        message: error?.message?.toString(),
        type: 'danger',
      });
    }
  }
};

const createFutureDate = (delayMinutes: number) => {
  const futureDate = new Date();
  futureDate.setMinutes(futureDate.getMinutes() + delayMinutes);
  return futureDate;
};

export const scheduleNotification = async (
  notification: Notification,
  rescheduleOptions?: {
    isReschedule?: boolean;
    delayMinutes?: number;
    retryCount?: number;
  },
): Promise<string | null> => {
  try {
    const {
      id,
      date,
      scheduleFrequency,
      attachments,
      telegramUsername,
      days,
      toContact,
      toMail,
      subject,
      type,
      message,
      memo,
    } = notification;

    await notifee.requestPermission();
    await createNotificationChannelIfNeeded();
    const channelId = storage.getString('notificationSound') || 'default';

    const notificationDate = rescheduleOptions?.isReschedule
      ? createFutureDate(rescheduleOptions.delayMinutes || RESCHEDULE_CONFIG.defaultDelay)
      : new Date(date);

    const trigger = buildTimestampTrigger(notificationDate, scheduleFrequency || undefined);

    const rescheduleInfoString = rescheduleOptions?.isReschedule
      ? JSON.stringify({
          isRescheduled: true,
          retryCount: (rescheduleOptions.retryCount || 0) + 1,
          delayMinutes: rescheduleOptions.delayMinutes || RESCHEDULE_CONFIG.defaultDelay,
        })
      : '';

    const notifeeNotification = buildNotifeeNotification(
      notification,
      channelId,
      notificationDate,
      rescheduleInfoString,
    );

    // Ensure all .data fields are strings (Notifee expects string values)
    const notificationData = Object.fromEntries(
      Object.entries({
        ...notification,
        id: id || '',
        type,
        message,
        date: notificationDate.toISOString(),
        subject: subject || '',
        days: JSON.stringify(days),
        toContact: JSON.stringify(toContact),
        toMail: JSON.stringify(toMail),
        attachments: JSON.stringify(attachments),
        memo: JSON.stringify(memo),
        telegramUsername: telegramUsername || '',
        rescheduleInfo: rescheduleInfoString,
      }).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]),
    );

    const notifeeNotificationId = await notifee.createTriggerNotification(
      {
        ...(id && { id: id }),
        ...notifeeNotification,
        data: notificationData,
      } as any,
      trigger,
    );

    if (!id) {
      await notifee.createTriggerNotification(
        {
          id: notifeeNotificationId,
          ...notifeeNotification,
          data: {
            ...(notificationData as any),
            id: notifeeNotificationId,
          },
        } as any,
        trigger,
      );
      return notifeeNotificationId;
    }

    return id;
  } catch (error: any) {
    if (error.message?.toString()?.includes('invalid notification ID')) {
      return null;
    }
    throw new Error(error);
  }
};

const useReminder = () => {
  const createNotification = async (notification: Notification): Promise<string | null> => {
    return executeWithRetry(async () => {
      const database = await getDatabase();

      if (!database) {
        console.error('[Database] Failed to open database connection');
        showMessage({
          message: 'Database connection error. Please try again.',
          type: 'danger',
        });
        return null;
      }

      const data = prepareNotificationData(notification);

      console.log('[Notification] Creating notification:', {
        id: data.id,
        type: data.type,
        subject: data.subject,
      });

      if (!data.id) {
        console.error('[Notification] Missing notification ID');
        showMessage({
          message: 'Failed to schedule notification. Please try again.',
          type: 'danger',
        });
        return null;
      }

      const insertNotificationSQL = `
      INSERT INTO notifications (id, type, message, date, subject, attachments, scheduleFrequency, memo, toMail, telegramUsername, days, latitude, longitude, radius, locationName, status)
      VALUES (
        '${data.id}',
        '${data.type}',
        '${data.message}',
        '${data.date}',
        '${data.subject}',
        '${data.attachments}',
        '${data.scheduleFrequency}',
        '${data.memo}',
        '${data.toMail}',
        '${data.telegramUsername}',
        '${data.days}',
        ${data.latitude || 'NULL'},
        ${data.longitude || 'NULL'},
        ${data.radius || 'NULL'},
        '${data.locationName || ''}',
        '${data.status || LocationReminderStatus.Pending}'
      )`;

      let insertContactsSQL = '';

      if (data.type === 'gmail') {
        insertContactsSQL = data.toMailArray
          .filter((email) => email)
          .map(
            (email) => `
          INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
          VALUES ('${data.id}', '${email}', null, '${email}', null)
        `,
          )
          .join(';');
      } else if (data.type !== 'location' && data.toContact.length > 0) {
        // Only insert contacts for non-location notifications that have contacts
        insertContactsSQL = data.toContact
          .map(
            (contact) => `
          INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
          VALUES ('${data.id}', '${contact.name}', ${contact.number ? `'${contact.number}'` : 'null'}, '${contact.recordID}', ${contact.thumbnailPath ? `'${contact.thumbnailPath}'` : 'null'})
        `,
          )
          .join(';');
      }

      const transactionSQL = `
      ${insertNotificationSQL};
      ${insertContactsSQL}
    `.trim();

      try {
        await database.execAsync('BEGIN TRANSACTION;');
        await database.execAsync(transactionSQL);
        await database.execAsync('COMMIT;');
        console.log('[Notification] Successfully created notification:', data.id);
        return data.id;
      } catch (error: any) {
        await database.execAsync('ROLLBACK;');
        console.error('[Notification] Failed to create notification:', error);
        throw new Error(error.message || error);
      }
    });
  };

  const updateNotification = async (notification: Notification): Promise<boolean> => {
    return executeWithRetry(async () => {
      const database = await getDatabase();

      if (!database) {
        console.error('[Database] Failed to open database connection');
        showMessage({
          message: 'Database connection error. Please try again.',
          type: 'danger',
        });
        return false;
      }

      const data = prepareNotificationData(notification);

      console.log('[Notification] Updating notification:', data.id);

      // Only schedule with Notifee for non-location notifications
      if (data.type !== 'location') {
        await createNotificationChannelIfNeeded();
        await scheduleNotification(notification);
      }

      const updateNotificationSQL = `
        UPDATE notifications
        SET
          type = '${data.type}',
          message = '${data.message}',
          date = '${data.date}',
          subject = '${data.subject}',
          attachments = '${data.attachments}',
          scheduleFrequency = '${data.scheduleFrequency}',
          days = '${data.days}',
          memo = '${data.memo}',
          toMail = '${data.toMail}',
          telegramUsername = '${data.telegramUsername}',
          latitude = ${data.latitude || 'NULL'},
          longitude = ${data.longitude || 'NULL'},
          radius = ${data.radius || 'NULL'},
          status = '${data.status || LocationReminderStatus.Pending}'
        WHERE id = '${data.id}'
      `;

      const deleteContactsSQL = `DELETE FROM contacts WHERE notification_id = '${data.id}'`;

      let insertContactsSQL = '';
      if (data.type === 'gmail' && data.toMailArray.length > 0) {
        insertContactsSQL = data.toMailArray
          .map(
            (email: string) => `
            INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
            VALUES ('${data.id}', '${email?.trim()}', null, '${email?.trim()}', null)
          `,
          )
          .join(';');
      } else if (data.toContact && data.toContact.length > 0) {
        insertContactsSQL = data.toContact
          .map(
            (contact) => `
            INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
            VALUES (
              '${data.id}',
              '${contact.name.replace(/'/g, "''")}',
              ${contact.number ? `'${contact.number.replace(/'/g, "''")}'` : 'null'},
              '${contact.recordID.replace(/'/g, "''")}',
              ${contact.thumbnailPath ? `'${contact.thumbnailPath.replace(/'/g, "''")}'` : 'null'}
            )
          `,
          )
          .join(';');
      }

      const transactionSQL = `
        ${updateNotificationSQL};
        ${deleteContactsSQL};
        ${insertContactsSQL}
      `;

      try {
        await database.execAsync('BEGIN TRANSACTION;');
        await database.execAsync(transactionSQL);
        await database.execAsync('COMMIT;');
        console.log('[Notification] Successfully updated notification:', data.id);
        return true;
      } catch (error: any) {
        await database.execAsync('ROLLBACK;');
        console.error('[Notification] Failed to update notification:', error);
        throw new Error(String(error?.message || error));
      }
    });
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    return executeWithRetry(async () => {
      const database = await getDatabase();

      if (!database) {
        console.error('[Database] Failed to open database connection');
        showMessage({
          message: 'Database connection error. Please try again.',
          type: 'danger',
        });
        return false;
      }

      console.log('[Notification] Deleting notification:', id);

      try {
        await database.execAsync('BEGIN TRANSACTION;');
        await database.execAsync(`DELETE FROM contacts WHERE notification_id = '${id}'`);
        await database.execAsync(`DELETE FROM notifications WHERE id = '${id}'`);
        await database.execAsync('COMMIT;');
        console.log('[Notification] Successfully deleted notification:', id);
        return true;
      } catch (error: any) {
        await database.execAsync('ROLLBACK;');
        console.error('[Notification] Failed to delete notification:', error);
        throw new Error(String(error?.message || error));
      }
    });
  };

  const getAllNotifications = async (): Promise<Notification[]> => {
    return executeWithRetry(async () => {
      const database = await getDatabase();

      if (!database) {
        console.error('[Database] Failed to open database connection');
        showMessage({
          message: 'Database connection error. Please try again.',
          type: 'danger',
        });
        return [];
      }

      try {
        const notifications = await database.getAllAsync<any>('SELECT * FROM notifications');
        const result: Notification[] = [];

        for (const notification of notifications) {
          const contacts = await database.getAllAsync<Contact>(
            `SELECT name, number, recordID, thumbnailPath FROM contacts WHERE notification_id = '${notification.id}'`,
          );

          let days = [];
          try {
            days = notification.days ? JSON.parse(notification.days) : [];
          } catch (e) {
            console.error(
              '[Notification] Failed to parse days for notification:',
              notification.id,
              e,
            );
            days = [];
          }

          result.push({
            ...notification,
            date: new Date(notification.date),
            scheduleFrequency: notification.scheduleFrequency,
            days,
            toContact: contacts.filter((contact) => contact.number !== null),
            toMail: contacts
              .filter((contact) => contact.number === null)
              .map((contact) => contact.name),
            attachments: JSON.parse(notification.attachments),
            memo: JSON.parse(notification.memo),
            latitude: notification.latitude,
            longitude: notification.longitude,
            radius: notification.radius,
            locationName: notification.locationName,
            status:
              (notification.status as LocationReminderStatus) || LocationReminderStatus.Pending,
          });
        }

        console.log('[Notification] Successfully fetched notifications:', result.length);
        return result;
      } catch (error: any) {
        console.error('[Notification] Get all notifications error:', error);
        throw new Error(String(error?.message || error));
      }
    });
  };

  const getNotificationById = async (id: string): Promise<Notification | null> => {
    return executeWithRetry(async () => {
      const database = await getDatabase();

      if (!database) {
        console.error('[Database] Failed to open database connection');
        showMessage({
          message: 'Database connection error. Please try again.',
          type: 'danger',
        });
        return null;
      }

      if (!id) {
        console.error('[Notification] Missing notification ID');
        showMessage({
          message: 'Failed to fetch notification. Please try again.',
          type: 'danger',
        });

        return null;
      }

      console.log('[Notification] Fetching notification by ID:', id);

      try {
        const notifications = await database.getAllAsync<any>(
          `SELECT * FROM notifications WHERE id = '${id}'`,
        );

        if (notifications.length === 0) {
          console.log('[Notification] No notification found with ID:', id);
          return null;
        }

        const notification = notifications[0];
        const contacts = await database.getAllAsync<Contact>(
          `SELECT name, number, recordID, thumbnailPath FROM contacts WHERE notification_id = '${id}'`,
        );

        let days = [];
        try {
          days = notification.days ? JSON.parse(notification.days) : [];
        } catch (e) {
          console.error('[Notification] Failed to parse days for notification:', id, e);
          days = [];
        }

        const result: Notification = {
          ...notification,
          date: new Date(notification.date),
          scheduleFrequency: notification.scheduleFrequency,
          days,
          toContact: contacts.filter((contact) => contact.number !== null),
          toMail: contacts
            .filter((contact) => contact.number === null)
            .map((contact) => contact.name),
          attachments: JSON.parse(notification.attachments),
          memo: JSON.parse(notification.memo),
          latitude: notification.latitude,
          longitude: notification.longitude,
          radius: notification.radius,
          locationName: notification.locationName,
          status: (notification.status as LocationReminderStatus) || LocationReminderStatus.Pending,
        };

        console.log('[Notification] Successfully fetched notification by ID:', id);
        return result;
      } catch (error: any) {
        console.error('[Notification] Get notification by ID error:', error);
        throw new Error(String(error?.message || error));
      }
    });
  };

  const ensureDeviceContactsTable = async () => {
    return executeWithRetry(async () => {
      const database = await getDatabase();
      if (!database) {
        throw new Error('Database connection failed');
      }
      try {
        await database.execAsync(`CREATE TABLE IF NOT EXISTS device_contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          number TEXT,
          recordID TEXT NOT NULL,
          thumbnailPath TEXT
        );`);
      } catch (err) {
        console.error('[SQLite] Failed to ensure device_contacts table:', err);
      }
    });
  };

  const clearDeviceContacts = async () => {
    return executeWithRetry(async () => {
      const database = await getDatabase();
      if (!database) {
        throw new Error('Database connection failed');
      }
      try {
        await ensureDeviceContactsTable();
        await database.execAsync('DELETE FROM device_contacts');
      } catch (err) {
        console.error('[SQLite] clearDeviceContacts error:', err);
      }
    });
  };

  const insertDeviceContacts = async (contacts: Contact[]) => {
    return executeWithRetry(async () => {
      const database = await getDatabase();
      if (!database) {
        throw new Error('Database connection failed');
      }
      if (!contacts.length) return;
      try {
        await ensureDeviceContactsTable();
        const values = contacts
          .map(
            (c: Contact) =>
              `('${c.name.replace(/'/g, "''")}', '${c.number ? c.number.replace(/'/g, "''") : ''}', '${c.recordID}', '${c.thumbnailPath || ''}')`,
          )
          .join(',');
        await database.execAsync(
          `INSERT INTO device_contacts (name, number, recordID, thumbnailPath) VALUES ${values}`,
        );
      } catch (err) {
        console.error('[SQLite] insertDeviceContacts error:', err);
      }
    });
  };

  const getAllDeviceContacts = async () => {
    return executeWithRetry(async () => {
      const database = await getDatabase();
      if (!database) {
        throw new Error('Database connection failed');
      }
      try {
        await ensureDeviceContactsTable();
        const rows = await database.getAllAsync(
          'SELECT name, number, recordID, thumbnailPath FROM device_contacts ORDER BY name COLLATE NOCASE ASC',
        );
        return rows;
      } catch (err) {
        console.error('[SQLite] getAllDeviceContacts error:', err);
        return [];
      }
    });
  };

  return {
    createNotification,
    updateNotification,
    deleteNotification,
    getAllNotifications,
    getNotificationById,
    ensureDeviceContactsTable,
    clearDeviceContacts,
    insertDeviceContacts,
    getAllDeviceContacts,
  };
};

export default useReminder;

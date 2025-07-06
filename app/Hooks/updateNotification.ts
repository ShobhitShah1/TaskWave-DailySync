import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import * as SQLite from 'expo-sqlite';
import { showMessage } from 'react-native-flash-message';

import { storage } from '../Contexts/ThemeProvider';
import { Notification } from '../Types/Interface';
import { CHANNEL_ID, CHANNEL_NAME } from './useReminder';

export const updateNotification = async (notification: Notification): Promise<boolean> => {
  try {
    const database = await SQLite.openDatabaseAsync('notifications.db', {
      useNewConnection: true,
    });

    if (!database) {
      console.error('[Database] Failed to open database connection');
      showMessage({
        message: 'Database connection error. Please try again.',
        type: 'danger',
      });
      return false;
    }

    const { id, type, message, date, toContact, toMail, subject, attachments, memo } = notification;

    console.log('[Notification] Updating notification:', { id, type, subject });

    if (!id) {
      console.error('[Notification] Missing notification ID');
      return false;
    }

    let toMailArray;
    try {
      if (Array.isArray(toMail)) {
        toMailArray = toMail;
      } else if (typeof toMail === 'string') {
        toMailArray = JSON.parse(toMail);
      } else {
        toMailArray = [];
      }

      toMailArray = toMailArray.map((email: string) => email?.trim()).filter(Boolean);
    } catch (e) {
      console.error('[Notification] Failed to parse toMail array:', e);
      toMailArray = [];
    }

    const soundName = storage.getString('notificationSound');
    console.log('[Notification] Using sound:', soundName);

    try {
      const channelId = await notifee.createChannel({
        id: CHANNEL_ID,
        name: CHANNEL_NAME,
        visibility: AndroidVisibility.PUBLIC,
        importance: AndroidImportance.HIGH,
        sound: soundName || 'default',
      });

      console.log('[Notification] Created notification channel:', channelId);

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: date instanceof Date ? date.getTime() : new Date(date).getTime(),
        alarmManager: {
          type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        },
      };

      const notificationData = {
        ...notification,
        subject: subject || '',
        toContact: JSON.stringify(toContact || []),
        toMail: JSON.stringify(toMailArray),
        attachments: JSON.stringify(attachments || []),
        memo: JSON.stringify(memo || []),
      };

      try {
        await notifee.createTriggerNotification(
          {
            id: id?.toString(),
            title:
              type === 'gmail' ? subject : `Reminder: ${subject || 'You have an upcoming task'}`,
            body:
              message?.toString() ||
              `Don't forget! You have a task with ${toMailArray.join(
                ', ',
              )}. Please check details or contact them if needed.`,
            android: {
              channelId,
              visibility: AndroidVisibility.PUBLIC,
              importance: AndroidImportance.HIGH,
              pressAction: {
                id: 'default',
              },
            },
            data: notificationData as any,
          },
          trigger,
        );
        console.log('[Notification] Successfully created trigger notification');
      } catch (error: any) {
        if (!error.message?.includes('invalid notification ID')) {
          console.error('[Notification] Failed to create trigger notification:', error);
          showMessage({
            message: String(error?.message || error),
            type: 'danger',
          });
        }
        return false;
      }

      const escapedToMail = JSON.stringify(toMailArray).replace(/'/g, "''");
      const updateNotificationSQL = `
          UPDATE notifications
          SET
            type = '${type}',
            message = '${(message || '').toString().replace(/'/g, "''")}',
            date = '${new Date(date).toISOString()}',
            subject = '${(subject || '').replace(/'/g, "''")}',
            attachments = '${JSON.stringify(attachments || [])}',
            scheduleFrequency = '${notification.scheduleFrequency || ''}',
            memo = '${JSON.stringify(memo || [])}',
            toMail = '${escapedToMail}'
          WHERE id = '${id}'
        `;

      const deleteContactsSQL = `DELETE FROM contacts WHERE notification_id = '${id}'`;

      let insertContactsSQL = '';
      if (type === 'gmail' && toMailArray.length > 0) {
        insertContactsSQL = toMailArray
          .map(
            (email: string) => `
              INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
              VALUES ('${id}', '${email?.trim()}', null, '${email?.trim()}', null)
            `,
          )
          .join(';');
      } else if (toContact && toContact.length > 0) {
        insertContactsSQL = toContact
          .map(
            (contact) => `
              INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
              VALUES (
                '${id}',
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
        await database.execAsync(transactionSQL);
        console.log('[Notification] Successfully updated notification in database');
        return true;
      } catch (error: any) {
        console.error('[Notification] Failed to update notification in database:', error);
        if (!error.message?.includes('invalid notification ID')) {
          return false;
        }
        throw new Error(String(error?.message || error));
      }
    } catch (error) {
      console.error('[Notification] Failed to create notification channel:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Notification] Update notification error:', error);
    throw error;
  }
};

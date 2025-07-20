/* eslint-disable @typescript-eslint/no-explicit-any */
import notifee from '@notifee/react-native';
import { showMessage } from 'react-native-flash-message';

import { storage } from '@Contexts/ThemeProvider';
import { Notification } from '@Types/Interface';
import { getDatabase } from '@Utils/databaseUtils';
import {
  buildNotifeeNotification,
  buildTimestampTrigger,
  createNotificationChannelIfNeeded,
} from '@Utils/notificationHelpers';
import { prepareNotificationData } from '@Utils/prepareNotificationData';

export const updateNotification = async (notification: Notification): Promise<boolean> => {
  try {
    const database = await getDatabase();

    const data = prepareNotificationData(notification);
    const {
      id,
      type,
      message,
      date,
      toContact,

      subject,
      scheduleFrequency,
    } = data;

    console.log('[Notification] Updating notification:', { id, type, subject });

    if (!id) {
      console.error('[Notification] Missing notification ID');
      return false;
    }

    await createNotificationChannelIfNeeded();
    const channelId = storage.getString('notificationSound') || 'default';
    const trigger = buildTimestampTrigger(new Date(date), scheduleFrequency || undefined);
    const notifeeNotification = buildNotifeeNotification(notification, channelId, new Date(date));

    const notificationData = {
      id: String(data.id),
      type: String(data.type),
      message: String(data.message),
      date: String(data.date),
      subject: String(data.subject),
      scheduleFrequency: String(data.scheduleFrequency),
      telegramUsername: String(data.telegramUsername),
      toContact: JSON.stringify(data.toContact || []),
      toMail: JSON.stringify(data.toMail || []),
      attachments: JSON.stringify(data.attachments || []),
      memo: JSON.stringify(data.memo || []),
      days: JSON.stringify(data.days || []),
      toMailArray: JSON.stringify(data.toMailArray || []),
    };

    try {
      await notifee.createTriggerNotification(
        {
          id: id.toString(),
          ...notifeeNotification,
          data: notificationData,
        } as any,
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

    const updateNotificationSQL = `
        UPDATE notifications
        SET
          type = '${type}',
          message = '${message}',
          date = '${data.date}',
          subject = '${subject}',
          attachments = '${data.attachments}',
          scheduleFrequency = '${data.scheduleFrequency}',
          memo = '${data.memo}',
          toMail = '${data.toMail}'
        WHERE id = '${id}'
      `;

    const deleteContactsSQL = `DELETE FROM contacts WHERE notification_id = '${id}'`;

    let insertContactsSQL = '';
    if (type === 'gmail' && data.toMailArray.length > 0) {
      insertContactsSQL = data.toMailArray
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
          (contact: any) => `
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
    console.error('[Notification] Update notification error:', error);
    throw error;
  }
};

import { useState, useEffect } from "react";
import * as SQLite from "expo-sqlite";
import notifee, { TimestampTrigger, TriggerType } from "@notifee/react-native";
import { Contact, Notification } from "../Types/Interface";

// type Notification = Omit<Notification, "id">;

// Function to schedule a notification using Notifee
export const scheduleNotificationWithNotifee = async (
  notification: Notification
): Promise<string | null> => {
  try {
    const { date, to, type, message, subject } = notification;

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    // Schedule the notification with Notifee
    const notifeeNotificationId = await notifee.createTriggerNotification(
      {
        title: type === "gmail" ? subject : "New Message",
        body: message,
      },
      trigger
    );

    return notifeeNotificationId;
  } catch (error) {
    console.error("Error scheduling notification with Notifee:", error);
    return null;
  }
};

const useDatabase = () => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  async function openDatabase() {
    const database = await SQLite.openDatabaseAsync("notifications.db");
    setDb(database);
    await initializeDatabase(database);
  }

  useEffect(() => {
    openDatabase();
  }, []);

  const initializeDatabase = async (database: SQLite.SQLiteDatabase) => {
    await database.execAsync(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        subject TEXT,
        attachments TEXT
      );
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notification_id TEXT,
        name TEXT NOT NULL,
        number TEXT NOT NULL,
        FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE
      );
    `);
  };

  // Create a new notification, first schedule with Notifee, then store in the database
  const createNotification = async (
    notification: Notification
  ): Promise<string | null> => {
    if (!db) return null;

    // Schedule notification in Notifee first
    const notifeeNotificationId =
      await scheduleNotificationWithNotifee(notification);

    if (!notifeeNotificationId) {
      console.error("Failed to schedule notification in Notifee");
      return null;
    }

    const { type, message, date, to, subject, attachments } = notification;

    const insertNotificationSQL = `
      INSERT INTO notifications (id, type, message, date, subject, attachments)
      VALUES ('${notifeeNotificationId}', '${type}', '${message}', '${date.toISOString()}', '${subject}', '${JSON.stringify(attachments)}')
    `;

    const insertContactsSQL = to
      .map(
        (contact) => `
          INSERT INTO contacts (notification_id, name, number)
          VALUES ('${notifeeNotificationId}', '${contact.name}', '${contact?.number}')
        `
      )
      .join(";");

    const transactionSQL = `
      ${insertNotificationSQL};
      ${insertContactsSQL}
    `;

    await db.execAsync(transactionSQL);

    return notifeeNotificationId;
  };

  // Update the notification both in Notifee and database
  const updateNotification = async (
    notification: Notification
  ): Promise<boolean> => {
    if (!db) return false;

    const { id, type, message, date, to, subject, attachments } = notification;

    // Update notification in Notifee
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    try {
      await notifee.createTriggerNotification(
        {
          id, // use the existing notifeeNotificationId
          title: type === "gmail" ? subject : undefined,
          body: message,
        },
        trigger
      );
    } catch (error) {
      console.error("Error updating notification in Notifee:", error);
      return false;
    }

    // Update notification in database
    const updateNotificationSQL = `
      UPDATE notifications
      SET type = '${type}', message = '${message}', date = '${date.toISOString()}',
          subject = '${subject}', attachments = '${JSON.stringify(attachments)}'
      WHERE id = '${id}'
    `;

    const deleteContactsSQL = `
      DELETE FROM contacts WHERE notification_id = '${id}'
    `;

    const insertContactsSQL = to
      .map(
        (contact) => `
          INSERT INTO contacts (notification_id, name, number)
          VALUES ('${id}', '${contact.name}', '${contact?.number}')
        `
      )
      .join(";");

    const transactionSQL = `
      ${updateNotificationSQL};
      ${deleteContactsSQL};
      ${insertContactsSQL}
    `;

    try {
      await db.execAsync(transactionSQL);
      return true;
    } catch (error) {
      console.error("Error updating notification in the database:", error);
      return false;
    }
  };

  // Delete the notification both in Notifee and database
  const deleteNotification = async (id: string): Promise<boolean> => {
    if (!db) return false;

    try {
      // Cancel the notification in Notifee
      await notifee.cancelNotification(id);

      // Delete from the database
      await db.execAsync(`DELETE FROM notifications WHERE id = '${id}'`);
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  };

  const getAllNotifications = async (): Promise<Notification[]> => {
    await openDatabase();

    if (!db) return [];

    const notifications = await db.getAllAsync<any>(
      "SELECT * FROM notifications"
    );
    const result: Notification[] = [];

    for (const notification of notifications) {
      const contacts = await db.getAllAsync<Contact>(
        `SELECT name, number FROM contacts WHERE notification_id = '${notification.id}'`
      );

      result.push({
        ...notification,
        date: new Date(notification.date),
        to: contacts,
        attachments: JSON.parse(notification.attachments),
      });
    }

    return result;
  };

  return {
    initializeDatabase,
    createNotification,
    getAllNotifications,
    updateNotification,
    deleteNotification,
  };
};

export default useDatabase;

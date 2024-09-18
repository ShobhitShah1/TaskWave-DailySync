import { useState, useEffect } from "react";
import * as SQLite from "expo-sqlite";
import notifee, {
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import { Contact, Notification } from "../Types/Interface";

export const scheduleNotificationWithNotifee = async (
  notification: Notification
): Promise<string | null> => {
  try {
    const { date, type, message, subject } = notification;

    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: "reminder",
      name: "Reminder",
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    const notifeeNotificationId = await notifee.createTriggerNotification(
      {
        title: type === "gmail" ? subject : "New Message",
        body: message,
        android: { channelId },
      },
      trigger
    );

    return notifeeNotificationId;
  } catch (error) {
    console.error("Error scheduling notification with Notifee:", error);
    return null;
  }
};

const useReminder = () => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  async function openDatabase() {
    const database = await SQLite.openDatabaseAsync("notifications.db");
    setDb(database);
    await initializeDatabase(database);
    return database;
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
        number TEXT,
        FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE
      );
    `);
  };

  const createNotification = async (
    notification: Notification
  ): Promise<string | null> => {
    await openDatabase();

    if (!db) return null;

    const notifeeNotificationId =
      await scheduleNotificationWithNotifee(notification);

    if (!notifeeNotificationId) {
      console.error("Failed to schedule notification in Notifee");
      return null;
    }

    const { type, message, date, toContact, toMail, subject, attachments } =
      notification;

    const insertNotificationSQL = `
      INSERT INTO notifications (id, type, message, date, subject, attachments)
      VALUES ('${notifeeNotificationId}', '${type}', '${message}', '${date.toISOString()}', '${subject}', '${JSON.stringify(attachments)}')
    `;

    let insertContactsSQL = "";

    if (type === "gmail") {
      insertContactsSQL = toMail
        .map(
          (email) => `
          INSERT INTO contacts (notification_id, name, number)
          VALUES ('${notifeeNotificationId}', '${email}', null)
        `
        )
        .join(";");
    } else {
      insertContactsSQL = toContact
        .map(
          (contact) => `
          INSERT INTO contacts (notification_id, name, number)
          VALUES ('${notifeeNotificationId}', '${contact.name}', '${contact.number ?? null}')
        `
        )
        .join(";");
    }

    const transactionSQL = `
      ${insertNotificationSQL};
      ${insertContactsSQL}
    `;

    await db.execAsync(transactionSQL);

    return notifeeNotificationId;
  };

  const updateNotification = async (
    notification: Notification
  ): Promise<boolean> => {
    if (!db) return false;

    const { id, type, message, date, toContact, toMail, subject, attachments } =
      notification;

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    try {
      await notifee.createTriggerNotification(
        {
          id,
          title: type === "gmail" ? subject : undefined,
          body: message,
        },
        trigger
      );
    } catch (error) {
      console.error("Error updating notification in Notifee:", error);
      return false;
    }

    const updateNotificationSQL = `
      UPDATE notifications
      SET type = '${type}', message = '${message}', date = '${date.toISOString()}',
          subject = '${subject}', attachments = '${JSON.stringify(attachments)}'
      WHERE id = '${id}'
    `;

    const deleteContactsSQL = `
      DELETE FROM contacts WHERE notification_id = '${id}'
    `;

    let insertContactsSQL = "";

    if (type === "gmail") {
      insertContactsSQL = toMail
        .map(
          (email) => `
          INSERT INTO contacts (notification_id, name, number)
          VALUES ('${id}', '${email}', null)
        `
        )
        .join(";");
    } else {
      insertContactsSQL = toContact
        .map(
          (contact) => `
          INSERT INTO contacts (notification_id, name, number)
          VALUES ('${id}', '${contact.name}', '${contact.number ?? null}')
        `
        )
        .join(";");
    }

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

  const deleteNotification = async (id: string): Promise<boolean> => {
    if (!db) return false;

    try {
      await notifee.cancelNotification(id);

      await db.execAsync(`DELETE FROM notifications WHERE id = '${id}'`);
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  };

  const getAllNotifications = async (): Promise<Notification[]> => {
    const database = await openDatabase();

    if (!database) {
      return [];
    }

    const notifications = await database.getAllAsync<any>(
      "SELECT * FROM notifications"
    );
    const result: Notification[] = [];

    for (const notification of notifications) {
      const contacts = await database.getAllAsync<Contact>(
        `SELECT name, number FROM contacts WHERE notification_id = '${notification.id}'`
      );

      result.push({
        ...notification,
        date: new Date(notification.date),
        toContact: contacts.filter((contact) => contact.number !== null),
        toMail: contacts
          .filter((contact) => contact.number === null)
          .map((contact) => contact.name),
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

export default useReminder;

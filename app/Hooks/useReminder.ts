import { useState, useEffect } from "react";
import * as SQLite from "expo-sqlite";
import notifee, { TimestampTrigger, TriggerType } from "@notifee/react-native";
import { Contact, Notification } from "../Types/Interface";

// Function to schedule a notification using Notifee
export const scheduleNotificationWithNotifee = async (
  notification: Notification
): Promise<string | null> => {
  try {
    const { date, type, message, subject } = notification;

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

  // Create a new notification, first schedule with Notifee, then store in the database
  const createNotification = async (
    notification: Notification
  ): Promise<string | null> => {
    await openDatabase();

    if (!db) return null;

    // Schedule notification in Notifee first
    const notifeeNotificationId =
      await scheduleNotificationWithNotifee(notification);

    if (!notifeeNotificationId) {
      console.error("Failed to schedule notification in Notifee");
      return null;
    }

    const { type, message, date, toContact, toMail, subject, attachments } =
      notification;

    // Insert notification details into the notifications table
    const insertNotificationSQL = `
      INSERT INTO notifications (id, type, message, date, subject, attachments)
      VALUES ('${notifeeNotificationId}', '${type}', '${message}', '${date.toISOString()}', '${subject}', '${JSON.stringify(attachments)}')
    `;

    // Prepare SQL for contacts or email addresses
    let insertContactsSQL = "";

    if (type === "gmail") {
      // If it's a Gmail notification, insert email addresses
      insertContactsSQL = toMail
        .map(
          (email) => `
          INSERT INTO contacts (notification_id, name, number)
          VALUES ('${notifeeNotificationId}', '${email}', null)
        `
        )
        .join(";");
    } else {
      // If it's a regular notification, insert contacts (name and number)
      insertContactsSQL = toContact
        .map(
          (contact) => `
          INSERT INTO contacts (notification_id, name, number)
          VALUES ('${notifeeNotificationId}', '${contact.name}', '${contact.number ?? null}')
        `
        )
        .join(";");
    }

    // Combine the notification and contacts SQL into a transaction
    const transactionSQL = `
      ${insertNotificationSQL};
      ${insertContactsSQL}
    `;

    // Execute the SQL transaction
    await db.execAsync(transactionSQL);

    return notifeeNotificationId;
  };

  // Update the notification both in Notifee and the database
  const updateNotification = async (
    notification: Notification
  ): Promise<boolean> => {
    if (!db) return false;

    const { id, type, message, date, toContact, toMail, subject, attachments } =
      notification;

    // Update notification in Notifee
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    try {
      await notifee.createTriggerNotification(
        {
          id, // Use the existing Notifee notification ID
          title: type === "gmail" ? subject : undefined,
          body: message,
        },
        trigger
      );
    } catch (error) {
      console.error("Error updating notification in Notifee:", error);
      return false;
    }

    // Update notification details in the database
    const updateNotificationSQL = `
      UPDATE notifications
      SET type = '${type}', message = '${message}', date = '${date.toISOString()}',
          subject = '${subject}', attachments = '${JSON.stringify(attachments)}'
      WHERE id = '${id}'
    `;

    const deleteContactsSQL = `
      DELETE FROM contacts WHERE notification_id = '${id}'
    `;

    // Insert new contacts or email addresses based on the type of notification
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

    // Combine the update notification and contacts SQL into a single transaction
    const transactionSQL = `
      ${updateNotificationSQL};
      ${deleteContactsSQL};
      ${insertContactsSQL}
    `;

    try {
      // Execute the transaction to update the notification and contacts in the database
      await db.execAsync(transactionSQL);
      return true;
    } catch (error) {
      console.error("Error updating notification in the database:", error);
      return false;
    }
  };

  // Delete the notification both in Notifee and the database
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

import { useState, useEffect } from "react";
import * as SQLite from "expo-sqlite";
import { Contact, Notification } from "../Types/Interface";

type NewNotification = Omit<Notification, "id">;

const useDatabase = () => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    async function openDatabase() {
      const database = await SQLite.openDatabaseAsync("notifications.db");
      setDb(database);
      await initializeDatabase(database);
    }
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

  const createNotification = async (
    notification: NewNotification
  ): Promise<string | null> => {
    if (!db) return null;
    const { type, message, date, to, subject, attachments } = notification;
    const id = Date.now().toString(); // Generate a unique ID

    const insertNotificationSQL = `
      INSERT INTO notifications (id, type, message, date, subject, attachments)
      VALUES ('${id}', '${type}', '${message}', '${date.toISOString()}', '${subject}', '${JSON.stringify(attachments)}')
    `;

    const insertContactsSQL = to
      .map(
        (contact) => `
      INSERT INTO contacts (notification_id, name, number)
      VALUES ('${id}', '${contact.name}', '${contact.number}')
    `
      )
      .join(";");

    const transactionSQL = `
      ${insertNotificationSQL};
      ${insertContactsSQL}
    `;

    await db.execAsync(transactionSQL);

    return id;
  };

  const getAllNotifications = async (): Promise<Notification[]> => {
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

  const updateNotification = async (
    notification: Notification
  ): Promise<boolean> => {
    if (!db) return false;
    const { id, type, message, date, to, subject, attachments } = notification;

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
      VALUES ('${id}', '${contact.name}', '${contact.number}')
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
      console.error("Error updating notification:", error);
      return false;
    }
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    if (!db) return false;
    try {
      await db.execAsync(`DELETE FROM notifications WHERE id = '${id}'`);
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  };

  return {
    createNotification,
    getAllNotifications,
    updateNotification,
    deleteNotification,
  };
};

export default useDatabase;

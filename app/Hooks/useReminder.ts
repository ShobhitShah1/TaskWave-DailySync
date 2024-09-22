import { useState, useEffect } from "react";
import * as SQLite from "expo-sqlite";
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import { Contact, Notification } from "../Types/Interface";
import { Alert } from "react-native";

let CHANNEL_ID = "reminder";
let CHANNEL_NAME = "Reminder";

export const scheduleNotificationWithNotifee = async (
  notification: Notification
): Promise<string | null> => {
  try {
    const {
      date,
      type,
      message,
      subject,
      scheduleFrequency,
      toContact,
      toMail,
      attachments,
    } = notification;

    console.log("subject:", subject);

    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      visibility: AndroidVisibility.PUBLIC,
      importance: AndroidImportance.HIGH,
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
      repeatFrequency:
        scheduleFrequency === "Daily"
          ? RepeatFrequency.DAILY
          : scheduleFrequency === "Weekly"
            ? RepeatFrequency.WEEKLY
            : undefined,
    };

    const notificationData = {
      ...notification,
      subject: subject || "",
      toContact: JSON.stringify(toContact),
      toMail: JSON.stringify(toMail),
      attachments: JSON.stringify(attachments),
    };

    const notifeeNotificationId = await notifee.createTriggerNotification(
      {
        title:
          type === "gmail"
            ? subject
            : `Reminder: ${subject || "Upcoming Task"}`,
        body:
          message ||
          `You have a new notification. Contact: ${toContact?.map((contact) => contact.name).join(", ") || toMail.join(", ")}.`,
        android: {
          channelId,
          visibility: AndroidVisibility.PUBLIC,
          importance: AndroidImportance.HIGH,
        },
        data: notificationData as any,
      },
      trigger
    );

    return notifeeNotificationId;
  } catch (error: any) {
    throw new Error(error);
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
        attachments TEXT,
        scheduleFrequency TEXT
      );
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notification_id TEXT,
        name TEXT NOT NULL,
        number TEXT,
        recordID TEXT NOT NULL,
        thumbnailPath TEXT,
        FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE
      );
    `);
  };

  const createNotification = async (
    notification: Notification
  ): Promise<string | null> => {
    await openDatabase();

    if (!db) {
      Alert.alert("Error", "Database connection error. Please try again.");
      return null;
    }

    const notifeeNotificationId =
      await scheduleNotificationWithNotifee(notification);

    if (!notifeeNotificationId) {
      Alert.alert(
        "Error",
        "Failed to schedule notification. Please try again."
      );
      return null;
    }

    const { type, message, date, toContact, toMail, subject, attachments } =
      notification;

    const insertNotificationSQL = `
    INSERT INTO notifications (id, type, message, date, subject, attachments, scheduleFrequency)
    VALUES ('${notifeeNotificationId}', '${type}', '${message}', '${date.toISOString()}', '${subject}', '${JSON.stringify(attachments)}', '${notification.scheduleFrequency}')
  `;

    let insertContactsSQL = "";

    if (type === "gmail") {
      insertContactsSQL = toMail
        .map(
          (email) => `
        INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
        VALUES ('${notifeeNotificationId}', '${email}', null, '${email}', null)
      `
        )
        .join(";");
    } else {
      insertContactsSQL = toContact
        .map(
          (contact) => `
        INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
        VALUES ('${notifeeNotificationId}', '${contact.name}', '${contact.number ?? null}', '${contact.recordID}', '${contact.thumbnailPath ?? null}')
      `
        )
        .join(";");
    }

    const transactionSQL = `
    ${insertNotificationSQL};
    ${insertContactsSQL}
  `;

    try {
      await db.execAsync(transactionSQL);
      return notifeeNotificationId;
    } catch (error: any) {
      console.error("Error creating notification in database:", error);
      Alert.alert(
        "Error",
        error?.message ||
          "Failed to create notification in the database. Please try again."
      );
      return null;
    }
  };

  const updateNotification = async (
    notification: Notification
  ): Promise<boolean> => {
    if (!db) {
      Alert.alert("Error", "Database connection error. Please try again.");
      return false;
    }

    const { id, type, message, date, toContact, toMail, subject, attachments } =
      notification;

    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      visibility: AndroidVisibility.PUBLIC,
      importance: AndroidImportance.HIGH,
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: date.getTime(),
    };

    const notificationData = {
      ...notification,
      subject: subject || "",
      toContact: JSON.stringify(toContact),
      toMail: JSON.stringify(toMail),
      attachments: JSON.stringify(attachments),
    };

    try {
      await notifee.createTriggerNotification(
        {
          id,
          title:
            type === "gmail"
              ? subject
              : `Reminder: ${subject || "Upcoming Task"}`,
          body:
            message ||
            `You have a new notification. Contact: ${toContact?.map((contact) => contact.name).join(", ") || toMail.join(", ")}.`,
          android: {
            channelId,
            visibility: AndroidVisibility.PUBLIC,
            importance: AndroidImportance.HIGH,
          },
          data: notificationData as any,
        },
        trigger
      );
    } catch (error) {
      console.error("Error updating notification in Notifee:", error);
      Alert.alert("Error", "Failed to update notification. Please try again.");
      return false;
    }

    const updateNotificationSQL = `
    UPDATE notifications
    SET type = '${type}', message = '${message}', date = '${date.toISOString()}',
        subject = '${subject}', attachments = '${JSON.stringify(attachments)}',
        scheduleFrequency = '${notification.scheduleFrequency}'
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
        INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
        VALUES ('${id}', '${email}', null, '${email}', null)
      `
        )
        .join(";");
    } else {
      insertContactsSQL = toContact
        .map(
          (contact) => `
        INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
        VALUES ('${id}', '${contact.name}', '${contact.number ?? null}', '${contact.recordID}', '${contact.thumbnailPath ?? null}')
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
      Alert.alert(
        "Error",
        "Failed to update notification in the database. Please try again."
      );
      return false;
    }
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    const database = await openDatabase();

    if (!database) {
      Alert.alert("Error", "Database connection error. Please try again.");
      return false;
    }

    try {
      await notifee.cancelNotification(id);
      await database.execAsync(`DELETE FROM notifications WHERE id = '${id}'`);
      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Error", "Failed to delete notification. Please try again.");
      return false;
    }
  };

  const getAllNotifications = async (): Promise<Notification[]> => {
    const database = await openDatabase();

    if (!database) {
      Alert.alert("Error", "Database connection error. Please try again.");
      return [];
    }

    try {
      const notifications = await database.getAllAsync<any>(
        "SELECT * FROM notifications"
      );
      const result: Notification[] = [];

      for (const notification of notifications) {
        const contacts = await database.getAllAsync<Contact>(
          `SELECT name, number, recordID, thumbnailPath FROM contacts WHERE notification_id = '${notification.id}'`
        );

        result.push({
          ...notification,
          date: new Date(notification.date),
          scheduleFrequency: notification.scheduleFrequency,
          toContact: contacts.filter((contact) => contact.number !== null),
          toMail: contacts
            .filter((contact) => contact.number === null)
            .map((contact) => contact.name),
          attachments: JSON.parse(notification.attachments),
        });
      }

      return result;
    } catch (error) {
      console.error("Error retrieving notifications from database:", error);
      Alert.alert(
        "Error",
        "Failed to retrieve notifications. Please try again."
      );
      return [];
    }
  };

  const getNotificationById = async (
    id: string
  ): Promise<Notification | null> => {
    const database = await openDatabase();

    if (!database) {
      Alert.alert("Error", "Database connection error. Please try again.");
      return null;
    }

    try {
      const notificationQuery = await database.getAllAsync<any>(
        `SELECT * FROM notifications WHERE id = '${id}'`
      );

      if (notificationQuery.length === 0) {
        return null;
      }

      const notification = notificationQuery[0];

      const contacts = await database.getAllAsync<Contact>(
        `SELECT name, number, recordID, thumbnailPath FROM contacts WHERE notification_id = '${notification.id}'`
      );

      const result: Notification = {
        ...notification,
        date: new Date(notification.date),
        scheduleFrequency: notification.scheduleFrequency,
        toContact: contacts.filter((contact) => contact.number !== null),
        toMail: contacts
          .filter((contact) => contact.number === null)
          .map((contact) => contact.name),
        attachments: JSON.parse(notification.attachments),
      };

      return result;
    } catch (error) {
      console.error(
        "Error retrieving notification by ID from database:",
        error
      );
      Alert.alert(
        "Error",
        "Failed to retrieve notification. Please try again."
      );
      return null;
    }
  };

  return {
    initializeDatabase,
    createNotification,
    getAllNotifications,
    updateNotification,
    deleteNotification,
    getNotificationById,
  };
};

export default useReminder;

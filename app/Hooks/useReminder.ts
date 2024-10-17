import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidVisibility,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import * as SQLite from "expo-sqlite";
import { memo, useEffect, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { Contact, Notification } from "../Types/Interface";

let CHANNEL_ID = "reminder";
let CHANNEL_NAME = "Reminder";

export const scheduleNotificationWithNotifee = async (
  notification: Notification
): Promise<string | null> => {
  try {
    const {
      id,
      date,
      type,
      message,
      subject,
      scheduleFrequency,
      toContact,
      toMail,
      attachments,
      memo,
    } = notification;

    await notifee.requestPermission();

    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      visibility: AndroidVisibility.PUBLIC,
      importance: AndroidImportance.HIGH,
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp:
        date instanceof Date ? date.getTime() : new Date(date).getTime(),
      repeatFrequency:
        scheduleFrequency === "Daily"
          ? RepeatFrequency.DAILY
          : scheduleFrequency === "Weekly"
            ? RepeatFrequency.WEEKLY
            : undefined,
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      },
    };

    const notificationData = {
      ...notification,
      id: id || "",
      type,
      message,
      date: date.toISOString(),
      subject: subject || "",
      toContact: JSON.stringify(toContact),
      toMail: JSON.stringify(toMail),
      attachments: JSON.stringify(attachments),
      memo: JSON.stringify(memo),
    };

    const notifeeNotificationId = await notifee.createTriggerNotification(
      {
        title:
          type === "gmail"
            ? subject
            : `Reminder: ${subject || "You have an upcoming task"}`,
        body:
          message.toString() ||
          `Don't forget! You have a task with ${toContact?.map((contact) => contact.name).join(", ") || toMail.join(", ")}. Please check details or contact them if needed.`,
        android: {
          channelId,
          visibility: AndroidVisibility.PUBLIC,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: "default",
          },
        },
        data: notificationData as any,
      },
      trigger
    );

    await notifee.createTriggerNotification(
      {
        id: notifeeNotificationId,
        title:
          type === "gmail"
            ? subject
            : `Reminder: ${subject || "You have an upcoming task"}`,
        body:
          message.toString() ||
          `Don't forget! You have a task with ${toContact?.map((contact) => contact.name).join(", ") || toMail.join(", ")}. Please check details or contact them if needed.`,
        android: {
          channelId,
          visibility: AndroidVisibility.PUBLIC,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: "default",
          },
        },
        data: {
          ...notificationData,
          id: notifeeNotificationId,
        } as any,
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
        scheduleFrequency TEXT,
        memo TEXT
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
      showMessage({
        message: "Database connection error. Please try again.",
        type: "danger",
      });
      return null;
    }

    const {
      type,
      message,
      date,
      toContact,
      toMail,
      subject,
      attachments,
      id,
      memo,
    } = notification;

    if (!id) {
      showMessage({
        message: "Failed to schedule notification. Please try again.",
        type: "danger",
      });
      return null;
    }

    const insertNotificationSQL = `
    INSERT INTO notifications (id, type, message, date, subject, attachments, scheduleFrequency, memo)
    VALUES ('${id}', '${type}', '${message.toString()}', '${date.toISOString()}', '${subject}', '${JSON.stringify(attachments)}', '${notification.scheduleFrequency}', '${JSON.stringify(memo)}')
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
    ${insertNotificationSQL};
    ${insertContactsSQL}
  `;

    try {
      await db.execAsync(transactionSQL);
      return id;
    } catch (error: any) {
      console.log("error?.message", error?.message);
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
      return null;
    }
  };

  const updateNotification = async (
    notification: Notification
  ): Promise<boolean> => {
    const database = await openDatabase();

    if (!database) {
      showMessage({
        message: "Database connection error. Please try again.",
        type: "danger",
      });
      return false;
    }

    const {
      id,
      type,
      message,
      date,
      toContact,
      toMail,
      subject,
      attachments,
      memo,
    } = notification;

    const toContactArray = Array.isArray(toContact) ? toContact : [];
    const toMailArray = Array.isArray(toMail) ? toMail : [];

    const channelId = await notifee.createChannel({
      id: CHANNEL_ID,
      name: CHANNEL_NAME,
      visibility: AndroidVisibility.PUBLIC,
      importance: AndroidImportance.HIGH,
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp:
        date instanceof Date ? date.getTime() : new Date(date).getTime(),
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      },
    };

    const notificationData = {
      ...notification,
      subject: subject || "",
      toContact: JSON.stringify(toContactArray),
      toMail: JSON.stringify(toMailArray),
      attachments: JSON.stringify(attachments),
      memo: JSON.stringify(memo),
    };

    try {
      await notifee.createTriggerNotification(
        {
          id,
          title:
            type === "gmail"
              ? subject
              : `Reminder: ${subject || "You have an upcoming task"}`,
          body:
            message.toString() ||
            `Don't forget! You have a task with ${
              toContactArray.map((contact) => contact.name).join(", ") ||
              toMailArray.join(", ")
            }. Please check details or contact them if needed.`,
          android: {
            channelId,
            visibility: AndroidVisibility.PUBLIC,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: "default",
            },
          },
          data: notificationData as any,
        },
        trigger
      );
    } catch (error: any) {
      console.error("Error updating notification in Notifee:", error);
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
      return false;
    }

    const updateNotificationSQL = `UPDATE notifications SET type = '${type}', message = '${message.toString()}', date = '${date.toISOString()}', subject = '${subject}', attachments = '${JSON.stringify(attachments)}', scheduleFrequency = '${notification.scheduleFrequency}', memo = '${JSON.stringify(memo)}' WHERE id = '${id}'`;

    const deleteContactsSQL = `DELETE FROM contacts WHERE notification_id = '${id}'`;

    const insertContactsSQL = toContactArray
      .map(
        (contact) =>
          `INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath) VALUES ('${id}', '${contact.name}', '${contact.number ?? null}', '${contact.recordID}', '${contact.thumbnailPath ?? null}')`
      )
      .join(";");

    const transactionSQL = `${updateNotificationSQL}; ${deleteContactsSQL}; ${insertContactsSQL}`;

    try {
      const response = await database.execAsync(transactionSQL);
      console.log("response:", response);
      return true;
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
      return false;
    }
  };

  const deleteNotification = async (id: string): Promise<boolean> => {
    const database = await openDatabase();

    if (!database) {
      showMessage({
        message: "Database connection error. Please try again.",
        type: "danger",
      });
      return false;
    }

    try {
      await notifee.cancelNotification(id);
      await database.execAsync(`DELETE FROM notifications WHERE id = '${id}'`);
      return true;
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
      return false;
    }
  };

  const getAllNotifications = async (): Promise<Notification[]> => {
    const database = await openDatabase();

    if (!database) {
      showMessage({
        message: "Database connection error. Please try again.",
        type: "danger",
      });
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
          memo: JSON.parse(notification.memo),
        });
      }

      return result;
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
      return [];
    }
  };

  const getNotificationById = async (
    id: string
  ): Promise<Notification | null> => {
    const database = await openDatabase();

    if (!database) {
      showMessage({
        message: "Database connection error. Please try again.",
        type: "danger",
      });
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
        memo: JSON.parse(notification.memo),
      };

      return result;
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
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

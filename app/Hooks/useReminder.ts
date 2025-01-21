import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidVisibility,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { Contact, Notification } from "../Types/Interface";
import { storage } from "../Contexts/ThemeProvider";
import { sounds } from "../Constants/Data";

export const CHANNEL_ID = "reminder";
export const CHANNEL_NAME = "Reminder";

export const createNotificationChannel = async () => {
  try {
    const channelId = storage.getString("notificationSound");

    if (!channelId) {
      storage.set("notificationSound", "default");
    }

    sounds.map(async (notification) => {
      await notifee.createChannel({
        id: notification?.soundKeyName,
        name:
          CHANNEL_NAME + " " + notification.soundKeyName?.toLocaleUpperCase(),
        visibility: AndroidVisibility.PUBLIC,
        importance: AndroidImportance.HIGH,
        sound: notification?.soundKeyName,
      });
    });
  } catch (error: any) {
    showMessage({
      message: error?.message?.toString(),
      type: "danger",
    });
  }
};

export const scheduleNotification = async (
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
      telegramUsername,
    } = notification;

    await notifee.requestPermission();

    await createNotificationChannel();

    const channelId = storage.getString("notificationSound");

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
      telegramUsername: telegramUsername || "",
    };

    const notifeeNotificationId = await notifee.createTriggerNotification(
      {
        title:
          type === "gmail"
            ? subject
            : `Reminder: ${subject || "You have an upcoming task"}`,
        body:
          message.toString() ||
          `Don't forget! You have a task with ${
            toContact?.map((contact) => contact.name).join(", ") ||
            toMail.join(", ")
          }. Please check details or contact them if needed.`,
        android: {
          channelId,
          sound: channelId,
          visibility: AndroidVisibility.PUBLIC,
          importance: AndroidImportance.HIGH,
          pressAction: { id: "default" },
          // smallIcon: "notification_icon",
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
          `Don't forget! You have a task with ${
            toContact?.map((contact) => contact.name).join(", ") ||
            toMail.join(", ")
          }. Please check details or contact them if needed.`,
        android: {
          channelId,
          sound: channelId,
          visibility: AndroidVisibility.PUBLIC,
          importance: AndroidImportance.HIGH,
          pressAction: { id: "default" },
          // smallIcon: "notification_icon",
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
    const database = await SQLite.openDatabaseAsync("notifications.db", {
      useNewConnection: true,
    });
    setDb(database);
    await initializeDatabase(database);
    return database;
  }

  useEffect(() => {
    openDatabase();
  }, []);

  const initializeDatabase = async (database: SQLite.SQLiteDatabase) => {
    await database.execAsync(`PRAGMA foreign_keys = ON;`);

    type PRAGMAResult = { user_version: number };

    type ColumnInfo = {
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: any;
      pk: number;
    };

    const result = await database.getAllAsync<PRAGMAResult>(
      `PRAGMA user_version;`
    );
    const currentVersion = result[0]?.user_version || 0;

    await database.execAsync("BEGIN TRANSACTION;");

    try {
      if (currentVersion < 1) {
        await database.execAsync(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          message TEXT NOT NULL,
          date TEXT NOT NULL,
          subject TEXT,
          attachments TEXT,
          scheduleFrequency TEXT,
          memo TEXT,
          toMail TEXT
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

        await database.execAsync(`PRAGMA user_version = 1;`);
      }

      if (currentVersion < 2) {
        const columnCheckResult = await database.getAllAsync<ColumnInfo>(
          `PRAGMA table_info(notifications);`
        );

        const telegramUsernameExists = columnCheckResult.some(
          (column) => column.name === "telegramUsername"
        );

        if (!telegramUsernameExists) {
          await database.execAsync(`
          ALTER TABLE notifications ADD COLUMN telegramUsername TEXT;
        `);
        }

        await database.execAsync(`PRAGMA user_version = 2;`);
      }

      await database.execAsync("COMMIT;");
    } catch (error) {
      await database.execAsync("ROLLBACK;");
      console.error("Database initialization error:", error);
      throw error;
    }
  };

  const createNotification = async (
    notification: Notification
  ): Promise<string | null> => {
    const database = await openDatabase();
    await initializeDatabase(database);

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
      telegramUsername,
    } = notification;

    if (!id) {
      showMessage({
        message: "Failed to schedule notification. Please try again.",
        type: "danger",
      });
      return null;
    }

    const toMailString = JSON.stringify(toMail || []);

    const insertNotificationSQL = `
    INSERT INTO notifications (id, type, message, date, subject, attachments, scheduleFrequency, memo, toMail, telegramUsername)
    VALUES (
      '${id}',
      '${type}',
      '${message?.toString() || ""}',
      '${date.toISOString()}',
      '${subject || ""}',
      '${JSON.stringify(attachments || [])}',
      '${notification.scheduleFrequency}',
      '${JSON.stringify(memo || [])}',
      '${toMailString}',
      '${telegramUsername?.toString().replace(/'/g, "''") || ""}'
    )`;

    let insertContactsSQL = "";

    if (type === "gmail") {
      const emailArray = Array.isArray(toMail) ? toMail : [toMail];
      insertContactsSQL = emailArray
        .filter((email) => email)
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
        VALUES ('${id}', '${contact.name}', ${
            contact.number ? `'${contact.number}'` : "null"
          }, '${contact.recordID}', ${
            contact.thumbnailPath ? `'${contact.thumbnailPath}'` : "null"
          })
      `
        )
        .join(";");
    }

    const transactionSQL = `
    ${insertNotificationSQL};
    ${insertContactsSQL}
  `.trim();

    try {
      await db.execAsync(transactionSQL);
      return id;
    } catch (error: any) {
      throw new Error(error.message || error);
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
      telegramUsername,
    } = notification;

    let toMailArray;
    try {
      if (Array.isArray(toMail)) {
        toMailArray = toMail;
      } else if (typeof toMail === "string") {
        toMailArray = JSON.parse(toMail);
      } else {
        toMailArray = [];
      }

      toMailArray = toMailArray
        .map((email: string) => email?.trim())
        .filter(Boolean);
    } catch (e) {
      toMailArray = [];
    }

    // const soundName = storage.getString("notificationSound");

    await createNotificationChannel();

    const channelId = storage.getString("notificationSound");

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
            type === "gmail"
              ? subject
              : `Reminder: ${subject || "You have an upcoming task"}`,
          body:
            message?.toString() ||
            `Don't forget! You have a task with ${toMailArray.join(
              ", "
            )}. Please check details or contact them if needed.`,
          android: {
            channelId,
            sound: channelId,
            visibility: AndroidVisibility.PUBLIC,
            importance: AndroidImportance.HIGH,
            pressAction: { id: "default" },
            // smallIcon: "notification_icon",
          },
          data: notificationData as any,
        },
        trigger
      );
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
      return false;
    }

    const escapedToMail = JSON.stringify(toMailArray).replace(/'/g, "''");
    const updateNotificationSQL = `
      UPDATE notifications
      SET
        type = '${type}',
        message = '${(message || "").toString().replace(/'/g, "''")}',
        date = '${date.toISOString()}',
        subject = '${(subject || "").replace(/'/g, "''")}',
        attachments = '${JSON.stringify(attachments || [])}',
        scheduleFrequency = '${notification.scheduleFrequency || ""}',
        memo = '${JSON.stringify(memo || [])}',
        toMail = '${escapedToMail}',
        telegramUsername = '${(telegramUsername || "")
          .toString()
          .replace(/'/g, "''")}'
      WHERE id = '${id}'
    `;

    const deleteContactsSQL = `DELETE FROM contacts WHERE notification_id = '${id}'`;

    let insertContactsSQL = "";
    if (type === "gmail" && toMailArray.length > 0) {
      insertContactsSQL = toMailArray
        .map(
          (email: string) => `
          INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
          VALUES ('${id}', '${email?.trim()}', null, '${email?.trim()}', null)
        `
        )
        .join(";");
    } else if (toContact && toContact.length > 0) {
      insertContactsSQL = toContact
        .map(
          (contact) => `
          INSERT INTO contacts (notification_id, name, number, recordID, thumbnailPath)
          VALUES (
            '${id}',
            '${contact.name.replace(/'/g, "''")}',
            ${
              contact.number
                ? `'${contact.number.replace(/'/g, "''")}'`
                : "null"
            },
            '${contact.recordID.replace(/'/g, "''")}',
            ${
              contact.thumbnailPath
                ? `'${contact.thumbnailPath.replace(/'/g, "''")}'`
                : "null"
            }
          )
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
      await database.execAsync(transactionSQL);
      return true;
    } catch (error: any) {
      throw new Error(String(error?.message || error));
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

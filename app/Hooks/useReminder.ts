import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidStyle,
  AndroidVisibility,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import * as SQLite from "expo-sqlite";
import { useEffect } from "react";
import { showMessage } from "react-native-flash-message";
import { sounds } from "../Constants/Data";
import { storage } from "../Contexts/ThemeProvider";
import { Contact, Notification, RescheduleConfig } from "../Types/Interface";

export const CHANNEL_ID = "reminder";
export const CHANNEL_NAME = "Reminder";

export const RESCHEDULE_CONFIG: RescheduleConfig = {
  defaultDelay: 1, // default 1 minutes
  maxRetries: 3, // optional: limit number of reschedules
};

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
    if (!error.message?.toString()?.includes("invalid notification ID")) {
      showMessage({
        message: error?.message?.toString(),
        type: "danger",
      });
    }
  }
};

const createFutureDate = (delayMinutes: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + delayMinutes);
  return date;
};

export const scheduleNotification = async (
  notification: Notification,
  rescheduleOptions?: {
    isReschedule?: boolean;
    delayMinutes?: number;
    retryCount?: number;
  }
): Promise<string | null> => {
  try {
    const {
      id,
      date,
      type,
      message,
      subject,
      scheduleFrequency,
      days,
      toContact,
      toMail,
      attachments,
      memo,
      telegramUsername,
    } = notification;

    await notifee.requestPermission();
    await createNotificationChannel();
    const channelId = storage.getString("notificationSound");

    const notificationDate = rescheduleOptions?.isReschedule
      ? createFutureDate(
          rescheduleOptions.delayMinutes || RESCHEDULE_CONFIG.defaultDelay
        )
      : date instanceof Date
      ? date
      : new Date(date);

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: notificationDate.getTime(),
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

    const rescheduleInfoString = rescheduleOptions?.isReschedule
      ? JSON.stringify({
          isRescheduled: true,
          retryCount: (rescheduleOptions.retryCount || 0) + 1,
          delayMinutes:
            rescheduleOptions.delayMinutes || RESCHEDULE_CONFIG.defaultDelay,
        })
      : "";

    const notificationData = {
      ...notification,
      id: id || "",
      type,
      message,
      date: notificationDate.toISOString(),
      subject: subject || "",
      days: JSON.stringify(days),
      toContact: JSON.stringify(toContact),
      toMail: JSON.stringify(toMail),
      attachments: JSON.stringify(attachments),
      memo: JSON.stringify(memo),
      telegramUsername: telegramUsername || "",
      rescheduleInfo: rescheduleInfoString,
    };

    const imageAttachment = attachments?.find((attachment) =>
      attachment.type?.startsWith("image/")
    );

    const notifeeNotificationId = await notifee.createTriggerNotification(
      {
        ...(id && {
          id: id,
        }),
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
          ...(imageAttachment?.fileCopyUri && {
            style: {
              type: AndroidStyle.BIGPICTURE,
              picture: imageAttachment?.fileCopyUri || "",
            },
          }),
        },
        data: notificationData as any,
      },
      trigger
    );

    if (!id) {
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
            ...(imageAttachment?.fileCopyUri && {
              style: {
                type: AndroidStyle.BIGPICTURE,
                picture: imageAttachment?.fileCopyUri || "",
              },
            }),
          },
          data: {
            ...(notificationData as any),
            id: notifeeNotificationId,
          },
        },
        trigger
      );

      return notifeeNotificationId;
    }

    return id;
  } catch (error: any) {
    console.log("SCHEDULE EROR:", error);
    if (error.message?.toString()?.includes("invalid notification ID")) {
      return null;
    }
    throw new Error(error);
  }
};

const useReminder = () => {
  async function openDatabase() {
    const database = await SQLite.openDatabaseAsync("notifications.db", {
      useNewConnection: true,
    });
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

      if (currentVersion < 3) {
        const columnCheckResult = await database.getAllAsync<ColumnInfo>(
          `PRAGMA table_info(notifications);`
        );

        const daysExists = columnCheckResult.some(
          (column) => column.name === "days"
        );

        if (!daysExists) {
          await database.execAsync(`
          ALTER TABLE notifications ADD COLUMN days TEXT;
        `);
        }

        await database.execAsync(`PRAGMA user_version = 3;`);
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

    if (!database) {
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
      days,
      id,
      memo,
      telegramUsername,
    } = notification;

    console.info("N create:", notification);

    if (!id) {
      showMessage({
        message: "Failed to schedule notification. Please try again.",
        type: "danger",
      });
      return null;
    }

    const toMailString = JSON.stringify(toMail || []);
    const daysString = JSON.stringify(days || []);

    const insertNotificationSQL = `
    INSERT INTO notifications (id, type, message, date, subject, attachments, scheduleFrequency, memo, toMail, telegramUsername, days)
    VALUES (
      '${id}',
      '${type}',
      '${(message || "").toString().replace(/'/g, "''")?.trim()}',
      '${date.toISOString()}',
      '${(subject || "").toString().replace(/'/g, "''")?.trim()}',
      '${JSON.stringify(attachments || [])}',
      '${notification.scheduleFrequency}',
      '${JSON.stringify(memo || [])}',
      '${toMailString}',
      '${telegramUsername?.toString().replace(/'/g, "''")?.trim() || ""}',
      '${daysString}'
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
      await database.execAsync(transactionSQL);
      return id;
    } catch (error: any) {
      console.log("CREATE CATCh:", error);
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
      days,
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

    await createNotificationChannel();

    await scheduleNotification(notification);

    const escapedToMail = JSON.stringify(toMailArray).replace(/'/g, "''");
    const escapedDays = JSON.stringify(days || []).replace(/'/g, "''");

    const updateNotificationSQL = `
      UPDATE notifications
      SET
        type = '${type}',
        message = '${(message || "").toString().replace(/'/g, "''")?.trim()}',
        date = '${date.toISOString()}',
        subject = '${(subject || "").replace(/'/g, "''")?.trim()}',
        attachments = '${JSON.stringify(attachments || [])}',
        scheduleFrequency = '${notification.scheduleFrequency || ""}',
        days = '${escapedDays}',
        memo = '${JSON.stringify(memo || [])}',
        toMail = '${escapedToMail}',
        telegramUsername = '${(telegramUsername || "")
          .toString()
          .replace(/'/g, "''")
          ?.trim()}'
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
      if (!error.message?.includes("invalid notification ID")) {
        showMessage({
          message: String(error?.message || error),
          type: "danger",
        });
      }
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

        let days = [];
        try {
          days = notification.days ? JSON.parse(notification.days) : [];
        } catch (e) {
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
        });
      }

      return result;
    } catch (error: any) {
      if (!error.message?.includes("invalid notification ID")) {
        showMessage({
          message: String(error?.message || error),
          type: "danger",
        });
      }
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

      let days = [];
      try {
        days = notification.days ? JSON.parse(notification.days) : [];
      } catch (e) {
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
      };

      return result;
    } catch (error: any) {
      if (!error.message?.includes("invalid notification ID")) {
        showMessage({
          message: String(error?.message || error),
          type: "danger",
        });
      }
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

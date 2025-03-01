import { showMessage } from "react-native-flash-message";
import { Notification } from "../Types/Interface";
import * as SQLite from "expo-sqlite";
import { CHANNEL_ID, CHANNEL_NAME } from "./useReminder";
import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidVisibility,
  TimestampTrigger,
  TriggerType,
} from "@notifee/react-native";
import { storage } from "../Contexts/ThemeProvider";

export const updateNotification = async (
  notification: Notification
): Promise<boolean> => {
  const database = await SQLite.openDatabaseAsync("notifications.db", {
    useNewConnection: true,
  });

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

  if (!id) {
    return false;
  }

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

  const soundName = storage.getString("notificationSound");

  const channelId = await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    visibility: AndroidVisibility.PUBLIC,
    importance: AndroidImportance.HIGH,
    sound: soundName || "default",
  });

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: date instanceof Date ? date.getTime() : new Date(date).getTime(),
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
    if (!error.message?.includes("invalid notification ID")) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
    }
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
        toMail = '${escapedToMail}'
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
    if (!error.message?.includes("invalid notification ID")) {
      return false;
    }

    throw new Error(String(error?.message || error));
  }
};

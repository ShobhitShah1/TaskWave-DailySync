import moment from "moment";
import { Notification } from "../Types/Interface";

const updateToNextDate = async (
  notification: Notification
): Promise<{
  updatedNotification: Notification | null;
}> => {
  const { scheduleFrequency, date } = notification;

  console.log("Inside:", notification);
  if (!scheduleFrequency) {
    return { updatedNotification: notification };
  }

  // Convert the date string to a Date object
  const currentDate = moment(date).toDate();

  let nextDate: Date;

  switch (scheduleFrequency) {
    case "Daily":
      nextDate = moment(currentDate).add(1, "day").toDate();
      break;
    case "Weekly":
      nextDate = moment(currentDate).add(1, "week").toDate();
      break;
    case "Monthly":
      nextDate = moment(currentDate).add(1, "month").toDate();
      break;
    case "Yearly":
      nextDate = moment(currentDate).add(1, "year").toDate();
      break;
    default:
      return { updatedNotification: notification };
  }

  const updatedNotification: Notification = {
    ...notification,
    attachments:
      typeof notification.attachments === "string"
        ? JSON.parse(notification.attachments)
        : notification.attachments,
    date: nextDate,
    memo:
      typeof notification.memo === "string"
        ? JSON.parse(notification.memo)
        : notification.memo,
    toContact:
      typeof notification.toContact === "string"
        ? JSON.parse(notification.toContact)
        : notification.toContact,
    toMail:
      typeof notification.toMail === "string"
        ? JSON.parse(notification.toMail)
        : notification.toMail,
  };

  return { updatedNotification: updatedNotification };
};

export default updateToNextDate;

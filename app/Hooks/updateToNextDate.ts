import moment from "moment";
import { Notification } from "../Types/Interface";

const updateToNextDate = (notification: Notification | any) => {
  const { scheduleFrequency, date } = notification;

  if (!scheduleFrequency) {
    return notification;
  }

  let nextDate: Date;

  switch (scheduleFrequency) {
    case "Daily":
      nextDate = moment(date).add(1, "day").toDate();
      break;
    case "Weekly":
      nextDate = moment(date).add(1, "week").toDate();
      break;
    case "Monthly":
      nextDate = moment(date).add(1, "month").toDate();
      break;
    case "Yearly":
      nextDate = moment(date).add(1, "year").toDate();
      break;
    default:
      return notification;
  }

  return {
    ...notification,
    date: nextDate,
  };
};

export default updateToNextDate;

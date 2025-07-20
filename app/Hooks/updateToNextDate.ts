import moment from 'moment';

import { Notification } from '@Types/Interface';

// Convert day name to number (0 = Sunday, 1 = Monday, etc.)
const dayToNumber = (day: string): number => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.indexOf(day);
};

const findNextOccurrence = (currentDayNumber: number, selectedDays: string[]): number => {
  if (!Array.isArray(selectedDays)) {
    try {
      selectedDays = JSON.parse(selectedDays);
      if (!Array.isArray(selectedDays)) {
        selectedDays = [];
      }
    } catch {
      selectedDays = [];
    }
  }

  const selectedDayNumbers = selectedDays
    .map((day) => dayToNumber(day))
    .filter((num) => num !== -1)
    .sort((a, b) => a - b);

  if (selectedDayNumbers.length === 0) {
    return 7; // If no valid days, add a week
  }

  // Find next day this week
  const nextDay = selectedDayNumbers.find((day) => day > currentDayNumber);

  if (nextDay !== undefined) {
    return nextDay - currentDayNumber; // Days to add to reach next occurrence
  }

  // If no days left this week, get first day of next week
  return 7 - currentDayNumber + selectedDayNumbers[0];
};

const updateToNextDate = async (
  notification: Notification,
): Promise<{ updatedNotification: Notification | null }> => {
  const { scheduleFrequency, date } = notification;

  if (!scheduleFrequency) {
    return { updatedNotification: notification };
  }

  const days = Array.isArray(notification.days)
    ? notification.days
    : typeof notification.days === 'string'
      ? JSON.parse(notification.days)
      : [];

  const currentDate = moment(date);
  let nextDate = moment(currentDate);

  switch (scheduleFrequency) {
    case 'Daily':
      nextDate.add(1, 'day');
      break;

    case 'Weekly':
      if (days.length > 0) {
        const daysToAdd = findNextOccurrence(currentDate.day(), days);
        nextDate.add(daysToAdd, 'days');
      } else {
        nextDate.add(1, 'week');
      }
      break;

    case 'Monthly':
      nextDate.add(1, 'month');
      break;

    case 'Yearly':
      nextDate.add(1, 'year');
      break;

    default:
      return { updatedNotification: notification };
  }

  const safeJSONParse = (value: any) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const updatedNotification: Notification = {
    ...notification,
    days,
    date: nextDate.toDate(),
    attachments: safeJSONParse(notification.attachments),
    memo: safeJSONParse(notification.memo),
    toContact: safeJSONParse(notification.toContact),
    toMail: safeJSONParse(notification.toMail),
  };

  return { updatedNotification };
};

export default updateToNextDate;

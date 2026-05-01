import { AlarmMeridiem, AlarmRepeat } from '@Types/Alarm';

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const to24Hour = (hour: number, meridiem: AlarmMeridiem) => {
  if (meridiem === 'AM') {
    return hour === 12 ? 0 : hour;
  }

  return hour === 12 ? 12 : hour + 12;
};

const getNextWeeklyDate = (baseDate: Date, repeatDays: string[]) => {
  const allowedIndexes = repeatDays
    .map((day) => DAY_KEYS.indexOf(day))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right);

  if (!allowedIndexes.length) {
    return baseDate;
  }

  const currentDay = baseDate.getDay();
  const sameWeekDay = allowedIndexes.find((dayIndex) => dayIndex >= currentDay);

  const targetIndex = sameWeekDay ?? allowedIndexes[0];
  const offset =
    targetIndex >= currentDay ? targetIndex - currentDay : 7 - currentDay + targetIndex;

  baseDate.setDate(baseDate.getDate() + offset);

  return baseDate;
};

export const buildNextAlarmDate = ({
  hour,
  minute,
  meridiem,
  repeat,
  repeatDays,
}: {
  hour: number;
  minute: number;
  meridiem: AlarmMeridiem;
  repeat: AlarmRepeat;
  repeatDays: string[];
}) => {
  const nextDate = new Date();
  nextDate.setSeconds(0, 0);
  nextDate.setHours(to24Hour(hour, meridiem), minute, 0, 0);

  if (repeat === 'weekly' && repeatDays.length) {
    getNextWeeklyDate(nextDate, repeatDays);
  }

  if (nextDate.getTime() <= Date.now()) {
    switch (repeat) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
    }
  }

  return nextDate;
};

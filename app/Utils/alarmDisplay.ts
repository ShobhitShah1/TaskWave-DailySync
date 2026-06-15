import { AlarmMeridiem, AlarmRepeat } from '@Types/Alarm';

const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatAlarmTime = (hour: number, minute: number, meridiem: AlarmMeridiem) => {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${meridiem}`;
};

export const formatAlarmInstantTime = (date: Date | string) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatAlarmDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatAlarmRepeatLabel = (repeat: AlarmRepeat, repeatDays: string[]) => {
  if (repeat === 'weekly' && repeatDays.length) {
    return [...repeatDays]
      .sort((left, right) => DAY_ORDER.indexOf(left) - DAY_ORDER.indexOf(right))
      .join(' ');
  }

  if (repeat === 'daily') {
    return 'Every day';
  }

  if (repeat === 'monthly') {
    return 'Monthly';
  }

  if (repeat === 'yearly') {
    return 'Yearly';
  }

  return 'One time';
};

export const formatAlarmCountdown = (targetDate: Date | string) => {
  const now = Date.now();
  const diff = Math.max(0, new Date(targetDate).getTime() - now);

  const hours = Math.floor(diff / (1000 * 60 * 60))
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    .toString()
    .padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

import moment from 'moment';

export const isSameDay = (date1: Date, date2: Date) => {
  return moment(date1).isSame(date2, 'day');
};

export const fromNowText = (date: Date) => {
  const target = moment(date).startOf('day');
  const today = moment().startOf('day');

  const diffDays = target.diff(today, 'days');

  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';

  if (diffDays > 0) {
    return `in ${diffDays} days`;
  } else {
    return `${Math.abs(diffDays)} days ago`;
  }
};

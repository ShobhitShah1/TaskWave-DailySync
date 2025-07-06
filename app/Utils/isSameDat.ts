import moment from 'moment';

export const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const fromNowText = (date: Date) => {
  return isSameDay(date, new Date()) ? 'Today' : moment(date).fromNow();
};

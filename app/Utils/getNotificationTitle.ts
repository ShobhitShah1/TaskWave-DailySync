export const getNotificationTitle = (notification: any): string => {
  if (!notification) return '';

  if (notification.type === 'note') {
    return 'Note';
  }

  if (notification.type === 'gmail') {
    return notification?.toMail?.[0];
  } else if (notification?.telegramUsername) {
    return notification?.telegramUsername?.toString();
  } else if (notification?.toContact) {
    return notification.toContact
      .map(
        (res: { name: string }, index: number) =>
          `${res.name}${index < notification.toContact.length - 1 ? ',' : ''} `,
      )
      .join('');
  }

  return '';
};

import { Notification } from '@Types/Interface';

export const getNotificationTitle = (notification: Notification): string => {
  if (!notification) return '';

  switch (notification.type) {
    case 'location':
      return notification.subject || '';

    case 'note':
      return 'Note';

    case 'gmail':
      return notification.toMail?.[0] || '';

    default:
      if (notification.telegramUsername) {
        return notification.telegramUsername.toString();
      }

      if (notification.toContact?.length) {
        return notification.toContact.map((contact) => contact.name).join(', ');
      }

      return '';
  }
};

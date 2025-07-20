import { Notification, NotificationType } from '@Types/Interface';

export function countNotificationsByType(
  notifications: Notification[],
): Record<NotificationType, number> {
  return notifications.reduce(
    (acc, { type }) => {
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    },
    {} as Record<NotificationType, number>,
  );
}

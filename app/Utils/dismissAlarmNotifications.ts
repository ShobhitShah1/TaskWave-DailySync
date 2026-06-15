import notifee from '@notifee/react-native';

export const dismissAlarmNotifications = async (alarmId: string, notificationId?: string) => {
  const notificationIds = new Set<string>([alarmId, notificationId].filter(Boolean) as string[]);

  try {
    const displayedNotifications = await notifee.getDisplayedNotifications();
    displayedNotifications.forEach(({ notification }) => {
      if (
        notification.id &&
        (notification.data?.alarmId === alarmId || notificationIds.has(notification.id))
      ) {
        notificationIds.add(notification.id);
      }
    });
  } catch (error) {
    console.warn('[AlarmNotification] Unable to inspect displayed notifications.', error);
  }

  await Promise.all(
    Array.from(notificationIds).map((id) => notifee.cancelNotification(id).catch(() => undefined)),
  );
};

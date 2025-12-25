import { getDatabase } from '@Utils/databaseUtils';
import { LocationReminderStatus } from '@Types/Interface';

/**
 * Updates the status of a location notification in the database
 * @param id - The notification ID
 * @param status - The new status ('pending', 'sent', 'expired')
 */
export const updateLocationNotificationStatus = async (
  id: string,
  status: LocationReminderStatus,
): Promise<boolean> => {
  try {
    const database = await getDatabase();

    const updateSQL = `
      UPDATE notifications
      SET status = '${status}'
      WHERE id = '${id}'
    `;

    await database.execAsync(updateSQL);
    console.log(`[LocationNotification] Status updated to '${status}' for notification: ${id}`);
    return true;
  } catch (error) {
    console.error('[LocationNotification] Failed to update status:', error);
    return false;
  }
};

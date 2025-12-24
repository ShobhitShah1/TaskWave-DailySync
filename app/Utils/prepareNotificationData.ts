import { Notification } from '@Types/Interface';

/**
 * Prepares and normalizes notification data for both SQL and notification payloads.
 * Centralizes all stringification, escaping, and array handling for notifications.
 *
 * @param notification The notification object to prepare
 * @returns An object with all fields formatted for SQL and notification use
 */
export function prepareNotificationData(notification: Notification) {
  // Destructure all relevant fields
  const {
    id,
    type,
    message,
    date,
    toContact,
    toMail,
    subject,
    attachments,
    days,
    memo,
    telegramUsername,
    scheduleFrequency,
    latitude,
    longitude,
    radius,
    locationName,
  } = notification;
  const status = notification.status || 'pending';

  // Helper to escape single quotes for SQL
  const escapeForSQL = (str?: string) => (str ? str.replace(/'/g, "''") : '');

  // Normalize arrays/objects for SQL
  const attachmentsString = JSON.stringify(attachments || []);
  const memoString = JSON.stringify(memo || []);
  const toMailString = JSON.stringify(toMail || []);
  const daysString = JSON.stringify(days || []);

  // Always use ISO string for date
  const isoDate = new Date(date).toISOString();

  // Normalize toMail as array of trimmed strings
  let toMailArray: string[] = [];
  if (Array.isArray(toMail)) {
    toMailArray = toMail.map((email) => email?.trim()).filter(Boolean);
  } else if (typeof toMail === 'string') {
    try {
      toMailArray = JSON.parse(toMail)
        .map((email: string) => email?.trim())
        .filter(Boolean);
    } catch {
      toMailArray = [];
    }
  }

  return {
    id,
    type,
    message: escapeForSQL(message),
    date: isoDate,
    subject: escapeForSQL(subject),
    attachments: attachmentsString,
    scheduleFrequency: scheduleFrequency || '',
    memo: memoString,
    toMail: toMailString,
    telegramUsername: escapeForSQL(telegramUsername),
    days: daysString,
    toContact: toContact || [],
    toMailArray,
    latitude,
    longitude,
    radius,
    locationName: escapeForSQL(locationName),
    status,
  };
}

export * from './SendMessage.types';
export { default } from './SendMessageModule';

import SendMessageModule from './SendMessageModule';

/**
 * Composes an email with the specified recipients, subject, body, and attachments.
 * @param recipients - Comma-separated string of email addresses.
 * @param subject - The subject of the email.
 * @param body - The body content of the email.
 * @param attachmentPaths - Comma-separated string of file paths to attach.
 */
export function sendMail(
  recipients: string,
  subject: string,
  body: string,
  attachmentPaths: string,
): void {
  return SendMessageModule.sendMail(recipients, subject, body, attachmentPaths);
}

/**
 * Sends an SMS message to the specified numbers, optionally with an attachment.
 * @param numbers - Array of phone numbers to send the SMS to.
 * @param message - The text message content.
 * @param firstAttachment - Optional path to an attachment.
 */
export function sendSms(numbers: string[], message: string, firstAttachment?: string): void {
  return SendMessageModule.sendSms(numbers, message, firstAttachment);
}

/**
 * Checks if an application with the given package ID is installed on the device.
 * @param packageId - The package identifier (e.g., "com.whatsapp").
 * @returns A promise resolving to `true` if installed, `false` otherwise.
 */
export function isAppInstalled(packageId: string): Promise<boolean> {
  return SendMessageModule.isAppInstalled(packageId);
}

/**
 * Sends a message via WhatsApp to a specific number.
 * @param numbers - The phone number (including country code) to send to.
 * @param message - The message content.
 * @param attachmentPaths - Comma-separated string of file paths to attach.
 * @param audioPaths - Path to an audio file to attach.
 * @param isWhatsapp - If `true`, uses standard WhatsApp; if `false`, uses WhatsApp Business.
 */
export function sendWhatsapp(
  numbers: string,
  message: string,
  attachmentPaths: string,
  audioPaths: string,
  isWhatsapp: boolean,
): void {
  return SendMessageModule.sendWhatsapp(numbers, message, attachmentPaths, audioPaths, isWhatsapp);
}

/**
 * Sends a message via Telegram to a specific username.
 * @param username - The Telegram username (without @).
 * @param message - The message content.
 */
export function sendTelegramMessage(username: string, message: string): void {
  return SendMessageModule.sendTelegramMessage(username, message);
}

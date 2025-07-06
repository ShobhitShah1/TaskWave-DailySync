// Reexport the native module. On web, it will be resolved to SendMessageModule.web.ts
// and on native platforms to SendMessageModule.ts
export * from './SendMessage.types';
export { default } from './SendMessageModule';
export { default as SendMessageView } from './SendMessageView';

import SendMessageModule from './SendMessageModule';

export function sendMail(
  recipients: string,
  subject: string,
  body: string,
  attachmentPaths: string,
): void {
  return SendMessageModule.sendMail(recipients, subject, body, attachmentPaths);
}

export function sendSms(numbers: string[], message: string, firstAttachment?: string): void {
  return SendMessageModule.sendSms(numbers, message, firstAttachment);
}

export function isAppInstalled(packageId: string): Promise<boolean> {
  return SendMessageModule.isAppInstalled(packageId);
}

export function sendWhatsapp(
  numbers: string,
  message: string,
  attachmentPaths: string,
  audioPaths: string,
  isWhatsapp: boolean,
): void {
  return SendMessageModule.sendWhatsapp(numbers, message, attachmentPaths, audioPaths, isWhatsapp);
}

export function sendTelegramMessage(username: string, message: string): void {
  return SendMessageModule.sendTelegramMessage(username, message);
}

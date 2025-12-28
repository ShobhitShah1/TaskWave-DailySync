// Reexport the native module. On web, it will be resolved to SendMessageModule.web.ts
// and on native platforms to SendMessageModule.ts
export * from './SendMessage.types';
export { default } from './SendMessageModule';
export { default as SendMessageView } from './SendMessageView';
import SendMessageModule from './SendMessageModule';
export function sendMail(recipients, subject, body, attachmentPaths) {
    return SendMessageModule.sendMail(recipients, subject, body, attachmentPaths);
}
export function sendSms(numbers, message, firstAttachment) {
    return SendMessageModule.sendSms(numbers, message, firstAttachment);
}
export function isAppInstalled(packageId) {
    return SendMessageModule.isAppInstalled(packageId);
}
export function sendWhatsapp(numbers, message, attachmentPaths, audioPaths, isWhatsapp) {
    return SendMessageModule.sendWhatsapp(numbers, message, attachmentPaths, audioPaths, isWhatsapp);
}
export function sendTelegramMessage(username, message) {
    return SendMessageModule.sendTelegramMessage(username, message);
}
//# sourceMappingURL=index.js.map
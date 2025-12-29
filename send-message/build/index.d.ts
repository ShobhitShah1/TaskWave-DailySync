export * from './SendMessage.types';
export { default } from './SendMessageModule';
export { default as SendMessageView } from './SendMessageView';
export declare function sendMail(recipients: string, subject: string, body: string, attachmentPaths: string): void;
export declare function sendSms(numbers: string[], message: string, firstAttachment?: string): void;
export declare function isAppInstalled(packageId: string): Promise<boolean>;
export declare function sendWhatsapp(numbers: string, message: string, attachmentPaths: string, audioPaths: string, isWhatsapp: boolean): void;
export declare function sendTelegramMessage(username: string, message: string): void;
//# sourceMappingURL=index.d.ts.map
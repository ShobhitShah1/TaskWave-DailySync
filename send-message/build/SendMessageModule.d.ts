export interface ISendMessageModule {
    sendMail(recipients: string, subject: string, body: string, attachmentPaths: string): void;
    sendSms(numbers: string[], message: string, firstAttachment?: string): void;
    isAppInstalled(packageId: string): Promise<boolean>;
    sendWhatsapp(numbers: string, message: string, attachmentPaths: string, audioPaths: string, isWhatsapp: boolean): void;
    sendTelegramMessage(username: string, message: string): void;
}
declare const SendMessageModule: ISendMessageModule;
export default SendMessageModule;
//# sourceMappingURL=SendMessageModule.d.ts.map
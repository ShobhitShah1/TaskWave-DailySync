import { ISendMessageModule } from './SendMessageModule';

const SendMessageModule: ISendMessageModule = {
  sendMail: (recipients, subject, body, attachmentPaths) => {
    alert(`sendMail: ${recipients}, ${subject}, ${body}, ${attachmentPaths}`);
  },
  sendSms: (numbers, message, firstAttachment) => {
    alert(`sendSms: ${numbers}, ${message}, ${firstAttachment}`);
  },
  isAppInstalled: async (packageId) => {
    alert(`isAppInstalled: ${packageId}`);
    return false;
  },
  sendWhatsapp: (numbers, message, attachmentPaths, audioPaths, isWhatsapp) => {
    alert(`sendWhatsapp: ${numbers}, ${message}, ${attachmentPaths}, ${audioPaths}, ${isWhatsapp}`);
  },
  sendTelegramMessage: (username, message) => {
    alert(`sendTelegramMessage: ${username}, ${message}`);
  },
};

export default SendMessageModule;

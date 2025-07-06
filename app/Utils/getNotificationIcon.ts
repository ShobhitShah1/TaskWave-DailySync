import AssetsPath from '../Constants/AssetsPath';
import { NotificationType } from '../Types/Interface';

export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'whatsapp':
      return AssetsPath.ic_whatsapp_history;
    case 'whatsappBusiness':
      return AssetsPath.ic_whatsappBusiness_history;
    case 'SMS':
      return AssetsPath.ic_sms_history;
    case 'gmail':
      return AssetsPath.ic_gmail_history;
    case 'phone':
      return AssetsPath.ic_phone_history;
    case 'telegram':
      return AssetsPath.ic_telegram_history;
    case 'note':
      return AssetsPath.ic_notes_history;
    default:
      return null;
  }
};

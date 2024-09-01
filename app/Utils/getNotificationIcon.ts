import AssetsPath from "../Global/AssetsPath";
import { NotificationType } from "../Types/Interface";

export const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "whatsapp":
      return AssetsPath.ic_whatsapp;
    case "whatsappBusiness":
      return AssetsPath.ic_whatsappBusiness;
    case "SMS":
      return AssetsPath.ic_sms;
    case "gmail":
      return AssetsPath.ic_gmail;
    default:
      return null;
  }
};

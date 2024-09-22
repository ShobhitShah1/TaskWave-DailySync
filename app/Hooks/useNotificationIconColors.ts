import { useMemo } from "react";
import { NotificationColor } from "../Components/ReminderCard";
import useThemeColors from "../Theme/useThemeMode";
import { NotificationType } from "../Types/Interface";
import AssetsPath from "../Global/AssetsPath";

const useNotificationIconColors = (
  notification: NotificationType
): NotificationColor => {
  const colors = useThemeColors();

  const colorMap = useMemo(() => {
    return {
      whatsapp: {
        backgroundColor: colors.whatsappBackground,
        typeColor: colors.whatsapp,
        iconColor: colors.whatsappDark,
        createViewColor: colors.whatsapp,
        icon: AssetsPath.ic_whatsapp,
      },
      whatsappBusiness: {
        backgroundColor: colors.whatsappBusinessBackground,
        typeColor: colors.whatsappBusiness,
        iconColor: colors.whatsappBusinessDark,
        createViewColor: colors.whatsappBusinessDark,
        icon: AssetsPath.ic_whatsappBusiness,
      },
      SMS: {
        backgroundColor: colors.smsBackground,
        typeColor: colors.sms,
        iconColor: colors.smsDark,
        createViewColor: colors.smsDark,
        icon: AssetsPath.ic_sms,
      },
      gmail: {
        backgroundColor: colors.gmailBackground,
        typeColor: colors.gmail,
        iconColor: colors.gmailDark,
        createViewColor: colors.gmailLightDark,
        icon: AssetsPath.ic_gmail,
      },
      phone: {
        backgroundColor: colors.smsBackground,
        typeColor: colors.sms,
        iconColor: colors.smsDark,
        createViewColor: colors.smsDark,
        icon: AssetsPath.ic_sms,
      },
    };
  }, [colors]);

  return colorMap[notification];
};

export default useNotificationIconColors;

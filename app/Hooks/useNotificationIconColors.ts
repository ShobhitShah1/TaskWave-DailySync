import { useMemo } from "react";
import { NotificationColor } from "../Components/ReminderCard";
import useThemeColors from "../Theme/useThemeMode";
import { NotificationType } from "../Types/Interface";

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
      },
      whatsappBusiness: {
        backgroundColor: colors.whatsappBusinessBackground,
        typeColor: colors.whatsappBusiness,
        iconColor: colors.whatsappBusinessDark,
        createViewColor: colors.whatsappBusinessDark,
      },
      SMS: {
        backgroundColor: colors.smsBackground,
        typeColor: colors.sms,
        iconColor: colors.smsDark,
        createViewColor: colors.smsDark,
      },
      gmail: {
        backgroundColor: colors.gmailBackground,
        typeColor: colors.gmail,
        iconColor: colors.gmailDark,
        createViewColor: colors.gmailLightDark,
      },
    };
  }, [colors]);

  return colorMap[notification];
};

export default useNotificationIconColors;

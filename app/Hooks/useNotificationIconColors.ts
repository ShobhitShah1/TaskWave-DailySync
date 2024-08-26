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
      },
      whatsappBusiness: {
        backgroundColor: colors.whatsappBusinessBackground,
        typeColor: colors.whatsappBusiness,
        iconColor: colors.whatsappBusinessDark,
      },
      SMS: {
        backgroundColor: colors.smsBackground,
        typeColor: colors.sms,
        iconColor: colors.smsDark,
      },
      gmail: {
        backgroundColor: colors.gmailBackground,
        typeColor: colors.gmail,
        iconColor: colors.gmailDark,
      },
    };
  }, [colors]);

  return colorMap[notification];
};

export default useNotificationIconColors;

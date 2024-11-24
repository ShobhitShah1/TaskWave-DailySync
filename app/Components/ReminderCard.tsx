import { useNavigation } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { useAppContext } from "../Contexts/ThemeProvider";
import isGridView from "../Hooks/isGridView";
import { useCountdownTimer } from "../Hooks/useCountdownTimer";
import useNotificationIconColors from "../Hooks/useNotificationIconColors";
import useThemeColors from "../Hooks/useThemeMode";
import { ReminderCardProps } from "../Types/Interface";
import { getNotificationIcon } from "../Utils/getNotificationIcon";
import GridView from "./ReminderCards/GridList";
import ListView from "./ReminderCards/ListView";

const ReminderCard: React.FC<ReminderCardProps> = ({
  notification,
  deleteReminder,
  onRefreshData,
}) => {
  const isGrid = isGridView();
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const navigation = useNavigation();

  const { timeLeft, timeIsOver } = useCountdownTimer(notification.date);
  const notificationColors = useNotificationIconColors(notification.type);

  useEffect(() => {
    if (timeIsOver && onRefreshData) {
      onRefreshData();
    }
  }, [timeIsOver, timeLeft]);

  const cardBackgroundColor = useMemo(() => {
    return theme === "dark"
      ? colors.reminderCardBackground
      : notificationColors.backgroundColor;
  }, [
    theme,
    colors.reminderCardBackground,
    notificationColors.backgroundColor,
  ]);

  const typeColor = useMemo(() => {
    return notification.type === "gmail" && theme === "light"
      ? colors.gmailText
      : notification.type === "whatsappBusiness"
      ? notificationColors.createViewColor
      : notificationColors.typeColor;
  }, [notification.type, theme, colors.gmailText, notificationColors]);

  const icon = useMemo(
    () => getNotificationIcon(notification.type),
    [notification.type]
  );

  const onCardPress = useCallback(() => {
    navigation.navigate("ReminderPreview", {
      notificationData: notification,
    });
  }, [notification]);

  const onEditPress = useCallback(() => {
    navigation.navigate("CreateReminder", {
      notificationType: notification.type,
      id: notification?.id,
    });
  }, [notification]);

  return isGrid ? (
    <GridView
      icon={icon}
      typeColor={typeColor}
      onCardPress={onCardPress}
      onEditPress={onEditPress}
      notification={notification}
      deleteReminder={deleteReminder}
      cardBackgroundColor={cardBackgroundColor}
    />
  ) : (
    <ListView
      icon={icon}
      typeColor={typeColor}
      onCardPress={onCardPress}
      onEditPress={onEditPress}
      notification={notification}
      deleteReminder={deleteReminder}
      cardBackgroundColor={cardBackgroundColor}
    />
  );
};

export default memo(ReminderCard);

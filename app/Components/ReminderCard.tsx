import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
import { showMessage } from "react-native-flash-message";
import { useAppContext } from "../Contexts/ThemeProvider";
import isGridView from "../Hooks/isGridView";
import { useCountdownTimer } from "../Hooks/useCountdownTimer";
import useNotificationIconColors from "../Hooks/useNotificationIconColors";
import useDatabase, {
  scheduleNotificationWithNotifee,
} from "../Hooks/useReminder";
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
  const { createNotification } = useDatabase();

  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState<"date" | "time">("date");

  const { timeLeft, timeIsOver } = useCountdownTimer(notification?.date);
  const notificationColors = useNotificationIconColors(notification?.type);

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

  const onDuplicatePress = useCallback(() => {
    setShowDateTimeModal(true);
    setDatePickerMode("date");
  }, []);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      if (event.type === "set") {
        setSelectedDate(date || new Date());
        setDatePickerMode("time");
      } else {
        setShowDateTimeModal(false);
      }
    } else {
      setSelectedDate(date || new Date());
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowDateTimeModal(false);

    if (event.type === "set") {
      setSelectedTime(time || new Date());
      createDuplicateReminder();
    } else {
      setShowDateTimeModal(false);
    }
  };

  const createDuplicateReminder = async () => {
    try {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());

      const newNotification = { ...notification, date: newDateTime, id: "" };

      const notificationScheduleId = await scheduleNotificationWithNotifee(
        newNotification
      );

      if (notificationScheduleId?.trim()) {
        const data = {
          ...newNotification,
          id: notificationScheduleId,
        };
        const created = await createNotification(data);

        if (!created) {
          showMessage({
            message: String(created),
            type: "danger",
          });
        }
      } else {
        showMessage({
          message: "Failed to schedule notification.",
          type: "danger",
        });
      }
    } catch (error) {}
  };

  const renderDateTimePicker = useCallback(() => {
    return (
      <DateTimePicker
        mode={datePickerMode}
        display="default"
        value={datePickerMode === "date" ? selectedDate : selectedTime}
        minimumDate={new Date()}
        themeVariant={theme === "dark" ? "dark" : "light"}
        onChange={
          datePickerMode === "date" ? handleDateChange : handleTimeChange
        }
      />
    );
  }, [showDateTimeModal, datePickerMode, selectedDate, selectedTime]);

  return (
    <>
      {isGrid ? (
        <GridView
          notification={notification}
          onCardPress={onCardPress}
          onEditPress={onEditPress}
          onDuplicatePress={onDuplicatePress}
          cardBackgroundColor={cardBackgroundColor}
          icon={icon}
          typeColor={typeColor}
          deleteReminder={deleteReminder}
        />
      ) : (
        <ListView
          notification={notification}
          onCardPress={onCardPress}
          onEditPress={onEditPress}
          onDuplicatePress={onDuplicatePress}
          cardBackgroundColor={cardBackgroundColor}
          icon={icon}
          typeColor={typeColor}
          deleteReminder={deleteReminder}
        />
      )}

      {showDateTimeModal && renderDateTimePicker()}
    </>
  );
};

export default memo(ReminderCard);

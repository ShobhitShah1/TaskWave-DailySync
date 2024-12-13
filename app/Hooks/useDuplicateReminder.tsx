import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform } from "react-native";
import { showMessage } from "react-native-flash-message";
import useDatabase, {
  scheduleNotificationWithNotifee,
} from "../Hooks/useReminder";

export const useDuplicateReminder = (notification: any, theme: string) => {
  const { createNotification } = useDatabase();
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [datePickerMode, setDatePickerMode] = useState<"date" | "time">("date");

  const openDuplicateModal = () => {
    setShowDateTimeModal(true);
    setDatePickerMode("date");
  };

  const handleDateChange = (event: any, date?: Date) => {
    try {
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
    } catch (error: any) {
      setShowDateTimeModal(false);
      showMessage({
        message: error?.message?.toString(),
        type: "danger",
      });
    }
  };

  const handleTimeChange = async (event: any, time?: Date) => {
    try {
      setShowDateTimeModal(false);

      if (event.type === "set") {
        setSelectedTime(time || new Date());
        await createDuplicateReminder();
      } else {
        setShowDateTimeModal(false);
      }
    } catch (error: any) {
      setShowDateTimeModal(false);
      showMessage({
        message: error?.message?.toString(),
        type: "danger",
      });
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
        } else {
          showMessage({
            message: "Duplicate reminder created successfully.",
            type: "success",
          });
        }
      } else {
        showMessage({
          message: "Failed to schedule notification.",
          type: "danger",
        });
      }
    } catch (error) {
      showMessage({
        message: "Error creating duplicate reminder.",
        type: "danger",
      });
    }
  };

  const renderDateTimePicker = () => {
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
  };

  return {
    showDateTimeModal,
    renderDateTimePicker,
    openDuplicateModal,
  };
};

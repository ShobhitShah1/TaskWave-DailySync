import { useState } from "react";

export type PickerVisibleType = "date" | "time" | null;

export interface DateAndTimeState {
  date: Date | undefined;
  time: Date | undefined;
}

const useDateTimePicker = () => {
 
  const [selectedDateAndTime, setSelectedDateAndTime] = useState<DateAndTimeState>({
    date: undefined,
    time: undefined,
  });
  const [pickerVisibleType, setPickerVisibleType] = useState<PickerVisibleType>(null);

  const handleDatePress = () => {
    setPickerVisibleType("date");
  };

  const handleTimePress = () => {
    setPickerVisibleType("time");
  };

  const handlePickerChange = (event: any, selectedDate: Date | undefined) => {
    setPickerVisibleType(null);
    if (event.type === "set" && selectedDate) {
      const updatedDateTime =
        pickerVisibleType === "date"
          ? { date: selectedDate }
          : { time: selectedDate };
      setSelectedDateAndTime((prev) => ({ ...prev, ...updatedDateTime }));
    }
  };

  return {
    selectedDateAndTime,
    setSelectedDateAndTime,
    pickerVisibleType,
    setPickerVisibleType,
    handleDatePress,
    handleTimePress,
    handlePickerChange,
  };
};

export default useDateTimePicker; 
import { useState } from 'react';

export type PickerVisibleType = 'date' | 'time' | null;

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
    setPickerVisibleType('date');
  };

  const handleTimePress = () => {
    setPickerVisibleType('time');
  };

  const handlePickerChange = (event: any, selectedDate: Date | undefined) => {
    const activePickerType = pickerVisibleType;
    setPickerVisibleType(null);

    if (event.type === 'set' && selectedDate && activePickerType) {
      setSelectedDateAndTime((prev) => {
        if (activePickerType === 'date') {
          const nextDate = new Date(selectedDate);
          const currentTime = prev.time || new Date();

          const nextTime = new Date(nextDate);
          nextTime.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);

          return {
            date: nextDate,
            time: prev.time ? nextTime : prev.time,
          };
        }

        const baseDate = prev.date || new Date();
        const nextTime = new Date(baseDate);
        nextTime.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);

        return {
          ...prev,
          time: nextTime,
        };
      });
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

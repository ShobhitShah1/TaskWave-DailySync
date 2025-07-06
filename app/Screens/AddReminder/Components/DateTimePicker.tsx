import RNDateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';

import AddDateAndTime from '../Components/AddDateAndTime';

interface DateTimePickerProps {
  selectedDateAndTime: { date: Date | undefined; time: Date | undefined };
  handleDatePress: () => void;
  handleTimePress: () => void;
  pickerVisibleType: 'date' | 'time' | null;
  handlePickerChange: (event: any, selectedDate: Date | undefined) => void;
  setPickerVisibleType: (type: 'date' | 'time' | null) => void;
  themeColor: string;
  colors: any;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDateAndTime,
  handleDatePress,
  handleTimePress,
  pickerVisibleType,
  handlePickerChange,
  setPickerVisibleType,
  themeColor,
  colors,
}) => {
  return (
    <>
      <AddDateAndTime
        themeColor={themeColor}
        selectedDateAndTime={selectedDateAndTime}
        onDatePress={handleDatePress}
        onTimePress={handleTimePress}
      />
      {pickerVisibleType && (
        <RNDateTimePicker
          value={
            pickerVisibleType === 'date'
              ? selectedDateAndTime.date || new Date()
              : selectedDateAndTime.time || new Date()
          }
          mode={pickerVisibleType}
          is24Hour={false}
          minimumDate={new Date()}
          themeVariant="dark"
          display="default"
          onChange={handlePickerChange}
          negativeButton={{ label: 'Cancel', textColor: colors.text }}
        />
      )}
    </>
  );
};

export default DateTimePicker;

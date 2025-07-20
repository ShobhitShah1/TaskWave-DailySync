import React from 'react';
import AddScheduleFrequency, { FrequencyType, WeekDayType } from './AddScheduleFrequency';

interface ScheduleFrequencyPickerProps {
  scheduleFrequency: FrequencyType | null;
  setScheduleFrequency: React.Dispatch<React.SetStateAction<FrequencyType | null>>;
  selectedDays: WeekDayType[];
  setSelectedDays: React.Dispatch<React.SetStateAction<WeekDayType[]>>;
  themeColor: string;
}

const ScheduleFrequencyPicker: React.FC<ScheduleFrequencyPickerProps> = ({
  scheduleFrequency,
  setScheduleFrequency,
  selectedDays,
  setSelectedDays,
  themeColor,
}) => {
  return (
    <AddScheduleFrequency
      selectedDays={selectedDays}
      themeColor={themeColor}
      setSelectedDays={setSelectedDays}
      scheduleFrequency={scheduleFrequency}
      setScheduleFrequency={setScheduleFrequency}
    />
  );
};

export default ScheduleFrequencyPicker;

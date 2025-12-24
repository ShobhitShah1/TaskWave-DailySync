import { useState } from 'react';

import { FrequencyType, WeekDayType } from '../Components/AddScheduleFrequency';

const useScheduleFrequency = () => {
  const [scheduleFrequency, setScheduleFrequency] = useState<FrequencyType | null>(null);
  const [selectedDays, setSelectedDays] = useState<WeekDayType[]>([]);

  return {
    scheduleFrequency,
    setScheduleFrequency,
    selectedDays,
    setSelectedDays,
  };
};

export default useScheduleFrequency;

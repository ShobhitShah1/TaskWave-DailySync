import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList } from "react-native";

const useCalendar = (
  initialDate: Date = new Date(),
  initialSelectedDate: string = ""
) => {
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(() => {
    return (
      initialSelectedDate ||
      currentMonth.toLocaleDateString("en-GB").replace(/\//g, "-")
    );
  });
  const flatListRef = useRef<FlatList>(null);

  const daysArray = useMemo(() => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const currentDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const formattedDate = `${day.toString().padStart(2, "0")}-${(
        currentMonth.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${currentMonth.getFullYear()}`;

      return {
        date: day,
        dayOfWeek: currentDate
          .toLocaleDateString("en-US", { weekday: "short" })
          .slice(0, 3),
        formattedDate,
      };
    });
  }, [currentMonth]);

  const handleDayClick = useCallback((formattedDate: string, index: number) => {
    setSelectedDate(formattedDate);
    flatListRef.current?.scrollToIndex({
      animated: true,
      index,
      viewPosition: 0.48,
    });
  }, []);

  const goToPrevNextMonth = useCallback(
    (modifier: number) => {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + modifier)
      );
    },
    [currentMonth]
  );

  return {
    selectedDate,
    currentMonth,
    daysArray,
    flatListRef,
    handleDayClick,
    goToPrevNextMonth,
    setSelectedDate,
  };
};

export default useCalendar;

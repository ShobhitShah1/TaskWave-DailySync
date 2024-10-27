import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList } from "react-native";

const useCalendar = (
  initialDate: Date = new Date(),
  initialSelectedDate: string = ""
) => {
  const [currentMonth, setCurrentMonth] = useState(initialDate);

  const [daysArray, setDaysArray] = useState(() => {
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
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return (
      initialSelectedDate ||
      currentMonth.toLocaleDateString("en-GB").replace(/\//g, "-")
    );
  });

  const [selectedDateObject, setSelectedDateObject] = useState<Date>(
    () => initialDate
  );

  const flatListRef = useRef<FlatList>(null);

  const generateDaysArray = (month: Date) => {
    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    ).getDate();

    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const currentDate = new Date(month.getFullYear(), month.getMonth(), day);
      const formattedDate = `${day.toString().padStart(2, "0")}-${(
        month.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${month.getFullYear()}`;

      return {
        date: day,
        dayOfWeek: currentDate
          .toLocaleDateString("en-US", { weekday: "short" })
          .slice(0, 3),
        formattedDate,
      };
    });
  };

  useEffect(() => {
    setDaysArray(generateDaysArray(currentMonth));
  }, [currentMonth]);

  const handleDayClick = useCallback((formattedDate: string, index: number) => {
    const [day, month, year] = formattedDate.split("-").map(Number);
    const dateObject = new Date(year, month - 1, day);

    setSelectedDate(formattedDate);
    setSelectedDateObject(dateObject);

    flatListRef.current?.scrollToIndex({
      animated: true,
      index,
      viewPosition: 0.48,
    });
  }, []);

  const goToPrevMonth = useCallback(
    (modifier: number) => {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - modifier)
      );
    },
    [currentMonth]
  );

  const goToNextMonth = useCallback(
    (modifier: number) => {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + modifier)
      );
    },
    [currentMonth]
  );

  return {
    selectedDate,
    selectedDateObject,
    currentMonth,
    daysArray,
    setDaysArray,
    flatListRef,
    handleDayClick,
    goToPrevMonth,
    goToNextMonth,
    setSelectedDate,
    setSelectedDateObject,
    setCurrentMonth,
  };
};

export default useCalendar;

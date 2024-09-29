export const generateDaysArray = (month: Date) => {
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

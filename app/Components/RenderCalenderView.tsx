import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { FC, memo } from "react";
import { FONTS } from "../Constants/Theme";
import useThemeColors from "../Hooks/useThemeMode";
import { DayItem } from "../Types/Interface";

interface CalenderProps {
  item: DayItem;
  index: number;
  handleDayClick: (formattedDate: string, index: number) => void;
  selectedDate: string;
}

const RenderCalenderView: FC<CalenderProps> = ({
  item,
  index,
  handleDayClick,
  selectedDate,
}) => {
  const style = styles();
  const colors = useThemeColors();

  const isSelected = item.formattedDate === selectedDate;
  const backgroundColor = isSelected ? colors.lightBlue : "transparent";

  return (
    <Pressable
      key={item.date}
      style={style.calenderContainer}
      onPress={() => handleDayClick(item?.formattedDate, index)}
    >
      <Text numberOfLines={1} style={style.calenderWeekText}>
        {item?.dayOfWeek}
      </Text>
      <View style={[style.calenderDateTextView, { backgroundColor }]}>
        <Text
          numberOfLines={1}
          style={[
            style.calenderDayText,
            { color: isSelected ? colors.white : colors.text },
          ]}
        >
          {item?.date}
        </Text>
      </View>
    </Pressable>
  );
};

export default memo(RenderCalenderView);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    calenderContainer: {
      gap: 7,
      alignItems: "center",
      justifyContent: "center",
    },
    calenderWeekText: {
      fontSize: 16,
      letterSpacing: 1.1,
      color: "rgba(154, 156, 156, 0.7)",
      fontFamily: FONTS.SemiBold,
      textAlign: "center",
    },
    calenderDateTextView: {
      width: 29,
      height: 29,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 500,
    },
    calenderDayText: {
      fontSize: 16,
      color: colors.text,
      fontFamily: FONTS.Medium,
      textAlign: "center",
    },
  });
};

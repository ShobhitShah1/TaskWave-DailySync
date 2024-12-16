import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { FONTS } from "../Constants/Theme";
import useCalendar from "../Hooks/useCalendar";
import useThemeColors from "../Hooks/useThemeMode";

interface CalendarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const CalendarComponent: React.FC<CalendarProps> = ({
  selectedDate,
  onDateChange,
}) => {
  const style = styles();
  const { daysArray, flatListRef, handleDayClick } = useCalendar(new Date());

  const renderDay = ({ item, index }: { item: any; index: number }) => {
    const isSelected = item.formattedDate === selectedDate;

    return (
      <Pressable
        style={style.dayContainer}
        onPress={() => {
          handleDayClick(item.formattedDate, index);
          onDateChange(item.formattedDate);
        }}
      >
        <Text style={style.dayOfWeekText}>{item.dayOfWeek}</Text>
        <View
          style={[
            style.dateCircle,
            {
              backgroundColor: isSelected
                ? "rgba(38, 107, 235, 1)"
                : "transparent",
            },
          ]}
        >
          <Text style={style.dateText}>{item.date}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Animated.View style={style.container}>
      <FlatList
        horizontal
        ref={flatListRef}
        data={daysArray}
        contentContainerStyle={style.flatListContent}
        renderItem={renderDay}
        keyExtractor={(item, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
      />
    </Animated.View>
  );
};

export default CalendarComponent;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      marginVertical: 5,
    },
    flatListContent: {
      gap: 20,
    },
    dayContainer: {
      justifyContent: "center",
      alignItems: "center",
      gap: 7,
    },
    dayOfWeekText: {
      fontSize: 16,
      color: colors.placeholderText,
      fontFamily: FONTS.SemiBold,
      textAlign: "center",
    },
    dateCircle: {
      width: 29,
      height: 29,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 500,
    },
    dateText: {
      fontSize: 16,
      color: colors.text,
      fontFamily: FONTS.Medium,
      textAlign: "center",
    },
  });
};

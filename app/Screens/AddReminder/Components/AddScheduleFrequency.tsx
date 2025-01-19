import React, { FC, memo, useEffect } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { FONTS } from "../../../Constants/Theme";
import useThemeColors from "../../../Hooks/useThemeMode";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export const frequencies = ["Daily", "Weekly", "Monthly", "Yearly"];
export const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type FrequencyType = (typeof frequencies)[number];
export type WeekDayType = (typeof weekDays)[number];

interface AddScheduleFrequencyProps {
  themeColor: string;
  scheduleFrequency: FrequencyType | null;
  setScheduleFrequency: React.Dispatch<
    React.SetStateAction<FrequencyType | null>
  >;
  selectedDays: WeekDayType[];
  setSelectedDays: React.Dispatch<React.SetStateAction<WeekDayType[]>>;
}

interface SelectionItemProps {
  label: string;
  themeColor: string;
  isSelected: boolean;
  onToggle: () => void;
  isWeekly: boolean;
}

const SelectionItem: FC<SelectionItemProps> = ({
  label,
  themeColor,
  isSelected,
  onToggle,
  isWeekly = false,
}) => {
  const backgroundColor = useSharedValue("transparent");

  useEffect(() => {
    backgroundColor.value = withTiming(
      isSelected ? themeColor : "transparent",
      { duration: 300 }
    );
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  const opacity = useAnimatedStyle(() => ({
    opacity: withTiming(isSelected ? 1 : 0, { duration: 300 }),
  }));

  return (
    <Pressable style={styles.checkboxContainer} onPress={onToggle}>
      <Animated.View
        style={[
          styles.checkbox,
          {
            borderColor: themeColor,
            width: !isWeekly ? 22 : 19,
            height: !isWeekly ? 22 : 19,
          },
          animatedStyle,
        ]}
      >
        <Animated.Text style={[styles.checkmark, opacity]}>✓</Animated.Text>
      </Animated.View>
      <Text
        style={{ color: useThemeColors().text, fontSize: !isWeekly ? 16 : 14 }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const AddScheduleFrequency: FC<AddScheduleFrequencyProps> = ({
  themeColor,
  scheduleFrequency,
  setScheduleFrequency,
  selectedDays,
  setSelectedDays,
}) => {
  const colors = useThemeColors();

  const toggleFrequency = (frequency: string) => {
    Keyboard.dismiss();
    setScheduleFrequency(
      frequency === scheduleFrequency ? null : (frequency as FrequencyType)
    );
    if (frequency !== "Weekly") {
      setSelectedDays([]);
    }
  };

  const toggleDay = (day: WeekDayType) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: colors.text }]}>Reminder:</Text>

      <View style={styles.frequencyContainer}>
        {frequencies.map((frequency, index) => (
          <SelectionItem
            key={index}
            isWeekly={false}
            label={frequency}
            themeColor={themeColor}
            isSelected={scheduleFrequency === frequency}
            onToggle={() => toggleFrequency(frequency)}
          />
        ))}
      </View>

      {/* {scheduleFrequency === "Weekly" && (
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day) => (
            <SelectionItem
              key={day}
              label={day}
              isWeekly={true}
              themeColor={themeColor}
              isSelected={selectedDays.includes(day as WeekDayType)}
              onToggle={() => toggleDay(day as WeekDayType)}
            />
          ))}
        </View>
      )} */}
    </ScrollView>
  );
};

export default memo(AddScheduleFrequency);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    width: "100%",
    paddingBottom: 20,
  },
  title: {
    fontFamily: FONTS.Medium,
    fontSize: 19,
    marginBottom: 18,
  },
  frequencyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  weekDaysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 12,
  },
  checkbox: {
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  checkmark: {
    color: "white",
    fontSize: 13,
  },
});

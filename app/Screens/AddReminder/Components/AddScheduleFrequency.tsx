import React, { FC, memo, useEffect } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
import { FONTS } from "../../../Global/Theme";
import useThemeColors from "../../../Theme/useThemeMode";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export const frequencies = ["Daily", "Weekly", "Monthly", "Yearly"];

export type FrequencyType = (typeof frequencies)[number];

interface AddScheduleFrequencyProps {
  themeColor: string;
  scheduleFrequency: FrequencyType | null;
  setScheduleFrequency: React.Dispatch<
    React.SetStateAction<FrequencyType | null>
  >;
}

interface FrequencyItemProps {
  frequency: string;
  themeColor: string;
  scheduleFrequency: FrequencyType | null;
  toggleFrequency: (frequency: string) => void;
}

const FrequencyItem: FC<FrequencyItemProps> = ({
  frequency,
  themeColor,
  scheduleFrequency,
  toggleFrequency,
}) => {
  const isSelected = scheduleFrequency === frequency;

  const opacity = useSharedValue(0);
  const backgroundColor = useSharedValue("transparent");

  useEffect(() => {
    backgroundColor.value = withTiming(
      isSelected ? themeColor : "transparent",
      { duration: 300 }
    );
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: backgroundColor.value,
    };
  });

  return (
    <Pressable
      style={styles.checkboxContainer}
      onPress={() => toggleFrequency(frequency)}
    >
      <Animated.View
        style={[
          styles.checkbox,
          {
            borderColor: themeColor,
          },
          animatedStyle,
        ]}
      >
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </Animated.View>
      <Text style={[styles.label, { color: useThemeColors().text }]}>
        {frequency}
      </Text>
    </Pressable>
  );
};

const AddScheduleFrequency: FC<AddScheduleFrequencyProps> = ({
  themeColor,
  scheduleFrequency,
  setScheduleFrequency,
}) => {
  const colors = useThemeColors();

  const toggleFrequency = (frequency: string) => {
    Keyboard.dismiss();
    setScheduleFrequency(frequency);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Reminder:</Text>
      <View style={styles.checkboxContainer}>
        {frequencies.map((frequency) => (
          <FrequencyItem
            key={frequency}
            frequency={frequency}
            themeColor={themeColor}
            scheduleFrequency={scheduleFrequency}
            toggleFrequency={toggleFrequency}
          />
        ))}
      </View>
    </View>
  );
};

export default memo(AddScheduleFrequency);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 20,
  },
  title: {
    fontFamily: FONTS.Medium,
    fontSize: 19,
    marginBottom: 18,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
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
  label: {
    fontSize: 16,
    marginRight: 20,
  },
});

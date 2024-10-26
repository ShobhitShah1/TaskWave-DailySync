import React, { FC, memo, useEffect } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { FONTS } from "../../../Global/Theme";
import useThemeColors from "../../../Theme/useThemeMode";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
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
  const backgroundColor = useSharedValue("transparent");

  useEffect(() => {
    backgroundColor.value = withTiming(
      isSelected ? themeColor : "transparent",
      { duration: 300 }
    );
  }, [isSelected, scheduleFrequency]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  const opacity = useAnimatedStyle(() => ({
    opacity: withTiming(isSelected ? 1 : 0, { duration: 300 }),
  }));

  return (
    <Pressable
      style={styles.checkboxContainer}
      onPress={() => toggleFrequency(frequency)}
    >
      <Animated.View
        style={[styles.checkbox, { borderColor: themeColor }, animatedStyle]}
      >
        <Animated.Text style={[styles.checkmark, opacity]}>✓</Animated.Text>
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
    setScheduleFrequency(frequency === scheduleFrequency ? "" : frequency);
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: colors.text }]}>Reminder:</Text>
      <View style={styles.frequencyContainer}>
        {frequencies.map((frequency, index) => (
          <FrequencyItem
            key={index}
            frequency={frequency}
            themeColor={themeColor}
            scheduleFrequency={scheduleFrequency}
            toggleFrequency={toggleFrequency}
          />
        ))}
      </View>
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 12,
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
  },
});

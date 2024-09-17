import React, { FC } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { FONTS } from "../../../Global/Theme";
import useThemeColors from "../../../Theme/useThemeMode";

export const frequencies = ["Daily", "Weekly", "Monthly", "Yearly"];

export type FrequencyType = (typeof frequencies)[number];

interface AddScheduleFrequencyProps {
  themeColor: string;
  scheduleFrequency: FrequencyType | null;
  setScheduleFrequency: React.Dispatch<
    React.SetStateAction<FrequencyType | null>
  >;
}

const AddScheduleFrequency: FC<AddScheduleFrequencyProps> = ({
  themeColor,
  scheduleFrequency,
  setScheduleFrequency,
}) => {
  const colors = useThemeColors();

  const toggleFrequency = (frequency: string) => {
    setScheduleFrequency(frequency);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Reminder:</Text>
      <View style={styles.checkboxContainer}>
        {frequencies.map((frequency) => (
          <Animated.View key={frequency} style={styles.checkboxContainer}>
            <Pressable
              style={[
                styles.checkbox,
                {
                  borderColor:
                    scheduleFrequency === frequency
                      ? themeColor
                      : colors.grayTitle,
                  backgroundColor:
                    scheduleFrequency === frequency
                      ? colors.primary
                      : "transparent",
                },
              ]}
              onPress={() => toggleFrequency(frequency)}
            >
              {scheduleFrequency?.includes(frequency) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
            <Text style={[styles.label, { color: colors.text }]}>
              {frequency}
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

export default AddScheduleFrequency;

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
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    marginRight: 20,
  },
});

import React, { FC, memo } from "react";
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native";
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
    Keyboard.dismiss();
    setScheduleFrequency(frequency);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Reminder:</Text>
      <View style={styles.checkboxContainer}>
        {frequencies.map((frequency) => (
          <Pressable
            key={frequency}
            style={styles.checkboxContainer}
            onPress={() => toggleFrequency(frequency)}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: themeColor,
                  backgroundColor:
                    scheduleFrequency === frequency
                      ? themeColor
                      : "transparent",
                },
              ]}
            >
              {scheduleFrequency === frequency && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>
              {frequency}
            </Text>
          </Pressable>
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

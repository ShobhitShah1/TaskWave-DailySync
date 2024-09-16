import React, { FC, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import useThemeColors from "../../../Theme/useThemeMode";
import Animated from "react-native-reanimated";

const frequencies = ["Daily", "Weekly", "Monthly", "Yearly"];

interface AddScheduleFrequencyProps {
  themeColor: string;
}

const AddScheduleFrequency: FC<AddScheduleFrequencyProps> = ({
  themeColor,
}) => {
  const [selectedFrequencies, setSelectedFrequencies] = useState<string>("");
  //   const [selectedFrequencies, setSelectedFrequencies] = useState<string[]>([]);
  const colors = useThemeColors();

  const toggleFrequency = (frequency: string) => {
    setSelectedFrequencies(frequency);

    //* Multiple
    // setSelectedFrequencies((prev) =>
    //   prev.includes(frequency)
    //     ? prev.filter((item) => item !== frequency)
    //     : [...prev, frequency]
    // );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Reminder:</Text>
      <View style={styles.checkboxContainer}>
        {frequencies.map((frequency) => (
          <Animated.View style={styles.checkboxContainer}>
            <Pressable
              key={frequency}
              style={[
                styles.checkbox,
                {
                  borderColor:
                    selectedFrequencies === frequency
                      ? themeColor
                      : colors.grayTitle,
                  backgroundColor:
                    selectedFrequencies === frequency
                      ? colors.primary
                      : "transparent",
                },
              ]}
              onPress={() => toggleFrequency(frequency)}
            >
              {selectedFrequencies.includes(frequency) && (
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
    fontSize: 16,
    marginBottom: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
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

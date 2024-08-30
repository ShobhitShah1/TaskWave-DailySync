import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import useThemeColors from "../../Theme/useThemeMode";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";

const ReminderScheduled = () => {
  const style = styles();
  const { formattedTimeLeft, timeIsOver } = useCountdownTimer("12:00:00");

  console.log("formattedTimeLeft", formattedTimeLeft);

  return (
    <View style={style.container}>
      <Text>{formattedTimeLeft}</Text>
    </View>
  );
};

export default ReminderScheduled;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.background,
    },
  });
};

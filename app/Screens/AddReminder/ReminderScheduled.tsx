import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { FONTS } from "../../Global/Theme";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";
import useThemeColors from "../../Theme/useThemeMode";

const ReminderScheduled = () => {
  const style = styles();
  const { formattedTimeLeft } = useCountdownTimer("12:00:00");

  return (
    <View style={style.container}>
      <Text>{formattedTimeLeft}</Text>
      <Pressable onPress={addList} style={[style.contactDoneButtonView]}>
        <Text style={style.contactDoneButtonText}>Done</Text>
      </Pressable>
    </View>
  );
};

export default ReminderScheduled;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-end",
      backgroundColor: colors.background,
    },

    contactDoneButtonText: {
      color: colors.white,
      fontFamily: FONTS.Bold,
      fontSize: 18,
    },
    contactDoneButtonView: {
      width: 140,
      height: 43,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(64, 93, 240, 1)",
    },
  });
};

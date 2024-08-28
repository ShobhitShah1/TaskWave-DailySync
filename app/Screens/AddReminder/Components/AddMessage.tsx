import { Image, StyleSheet, Text, TextInput, View } from "react-native";
import React, { FC, memo } from "react";
import { FONTS, SIZE } from "../../../Global/Theme";
import useThemeColors from "../../../Theme/useThemeMode";
import AssetsPath from "../../../Global/AssetsPath";

interface AddMessageProps {
  themeColor: string;
}
const AddMessage: FC<AddMessageProps> = ({ themeColor }) => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.scheduleReminderCardBackground },
      ]}
    >
      <TextInput
        multiline
        spellCheck
        scrollEnabled
        textAlignVertical="top"
        placeholder="Message"
        placeholderTextColor={colors.placeholderText}
        style={[styles.textInputStyle, { color: colors.text }]}
      />

      <Image source={AssetsPath.ic_fullScreen} style={styles.fullScreen} />
    </View>
  );
};

export default memo(AddMessage);

const styles = StyleSheet.create({
  container: {
    minHeight: 150,
    width: "100%",
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: SIZE.listBorderRadius,
    marginBottom: 20,
  },
  textInputStyle: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 15,
    fontFamily: FONTS.Medium,
  },
  fullScreen: {
    top: 12,
    right: 12,
    width: 15,
    height: 15,
    zIndex: 999,
    position: "absolute",
    resizeMode: "contain",
  },
});

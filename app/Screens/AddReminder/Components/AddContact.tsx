import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import React, { FC, memo } from "react";
import useThemeColors from "../../../Theme/useThemeMode";
import { FONTS, SIZE } from "../../../Global/Theme";
import AssetsPath from "../../../Global/AssetsPath";
import TextString from "../../../Global/TextString";

interface AddContactProps {
  themeColor: string;
  onContactPress: () => void;
}

const AddContact: FC<AddContactProps> = ({ themeColor, onContactPress }) => {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onContactPress}
      style={[
        styles.container,
        { backgroundColor: colors.scheduleReminderCardBackground },
      ]}
    >
      <Text style={[styles.titleText, { color: colors.text }]}>
        {TextString.Contact}
      </Text>
      <Image
        resizeMode="contain"
        source={AssetsPath.ic_downArrow}
        style={styles.downArrow}
      />
    </Pressable>
  );
};

export default memo(AddContact);

const styles = StyleSheet.create({
  container: {
    height: 50,
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
    paddingHorizontal: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: SIZE.listBorderRadius,
  },
  downArrow: {
    width: 15,
    height: 15,
  },
  titleText: {
    fontFamily: FONTS.Medium,
    fontSize: 17,
  },
});

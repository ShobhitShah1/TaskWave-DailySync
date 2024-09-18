import React, { FC, memo, useCallback } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { FONTS, SIZE } from "../../../Global/Theme";
import useThemeColors from "../../../Theme/useThemeMode";

interface AddMailToProps {
  themeColor: string;
  to: string;
  setTo: React.Dispatch<React.SetStateAction<string>>;
}

const AddMailTo: FC<AddMailToProps> = ({ themeColor, to, setTo }) => {
  const style = styles();
  const colors = useThemeColors();

  const onChangeText = useCallback(
    (text: string) => {
      setTo(text);
    },
    [setTo]
  );

  return (
    <View
      style={[
        style.container,
        { backgroundColor: colors.scheduleReminderCardBackground },
      ]}
    >
      <TextInput
        multiline
        spellCheck
        scrollEnabled
        value={to}
        onChangeText={onChangeText}
        textAlignVertical="top"
        selectionColor={themeColor}
        placeholder="To:"
        placeholderTextColor={colors.text}
        style={[style.textInputStyle, { color: colors.text }]}
      />
    </View>
  );
};

export default memo(AddMailTo);

const styles = () => {
  return StyleSheet.create({
    container: {
      width: "100%",
      height: 50,
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
  });
};
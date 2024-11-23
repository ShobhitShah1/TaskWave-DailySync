import React, { FC, memo, useCallback } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { FONTS, SIZE } from "../../../Global/Theme";
import useThemeColors from "../../../Hooks/useThemeMode";

interface AddMailSubjectProps {
  themeColor: string;
  subject: string;
  setSubject: React.Dispatch<React.SetStateAction<string>>;
}

const AddMailSubject: FC<AddMailSubjectProps> = ({
  themeColor,
  subject,
  setSubject,
}) => {
  const style = styles();
  const colors = useThemeColors();

  const onChangeText = useCallback(
    (text: string) => {
      setSubject(text);
    },
    [setSubject]
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
        value={subject}
        onChangeText={onChangeText}
        textAlignVertical="top"
        selectionColor={themeColor}
        placeholder="Subject:"
        placeholderTextColor={colors.text}
        style={[style.textInputStyle, { color: colors.text }]}
      />
    </View>
  );
};

export default memo(AddMailSubject);

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

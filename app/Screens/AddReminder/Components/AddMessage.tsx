import React, { FC, memo, useCallback, useMemo, useState } from "react";
import {
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import FullScreenMessageModal from "../../../Components/FullScreenMessageModal";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import AssetsPath from "../../../Global/AssetsPath";
import { FONTS, SIZE } from "../../../Global/Theme";
import useThemeColors from "../../../Hooks/useThemeMode";

interface AddMessageProps {
  title?: "Message" | "Note";
  themeColor: string;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

const AddMessage: FC<AddMessageProps> = ({
  themeColor,
  message,
  setMessage,
  title,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const [fullScreen, setFullScreen] = useState(false);

  const backgroundColor = useMemo(
    () =>
      theme === "dark" ? "rgba(48, 51, 52, 0.9)" : "rgba(255,255,255,0.9)",
    [theme]
  );

  const toggleFullScreen = useCallback(() => {
    setFullScreen((prevState) => !prevState);
  }, []);

  const onChangeText = useCallback(
    (text: string) => {
      setMessage(text);
    },
    [setMessage]
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          value={message}
          placeholder={title || "Message"}
          textAlignVertical="top"
          onChangeText={onChangeText}
          selectionColor={themeColor}
          placeholderTextColor={colors.placeholderText}
          style={[
            style.textInputStyle,
            { color: colors.text, height: title === "Note" ? 100 : 160 },
          ]}
        />

        {title !== "Note" && (
          <Pressable
            onPress={() => setFullScreen(true)}
            style={style.fullScreen}
          >
            <Image
              tintColor={
                theme === "dark"
                  ? "rgba(255, 255, 255, 1)"
                  : "rgba(173, 175, 176, 1)"
              }
              source={AssetsPath.ic_fullScreen}
              style={{ width: 15, height: 15 }}
            />
          </Pressable>
        )}

        <FullScreenMessageModal
          message={message}
          isVisible={fullScreen}
          onClose={toggleFullScreen}
          themeColor={themeColor}
          onChangeText={onChangeText}
          backgroundColor={backgroundColor}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

export default memo(AddMessage);

const styles = () => {
  return StyleSheet.create({
    container: {
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
};

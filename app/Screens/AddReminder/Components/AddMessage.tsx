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
import useThemeColors from "../../../Theme/useThemeMode";

interface AddMessageProps {
  themeColor: string;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}

const AddMessage: FC<AddMessageProps> = ({
  themeColor,
  message,
  setMessage,
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
          onChangeText={onChangeText}
          textAlignVertical="top"
          selectionColor={themeColor}
          placeholder="Message"
          placeholderTextColor={colors.placeholderText}
          style={[style.textInputStyle, { color: colors.text }]}
        />

        <Pressable onPress={() => setFullScreen(true)} style={style.fullScreen}>
          <Image
            source={AssetsPath.ic_fullScreen}
            style={{ width: 15, height: 15 }}
          />
        </Pressable>

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
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      minHeight: 150,
      width: "100%",
      height: 160,
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

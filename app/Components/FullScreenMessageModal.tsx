import React, { FC, memo } from "react";
import { Image, Pressable, StyleSheet, TextInput, View } from "react-native";
import ReactNativeModal from "react-native-modal";
import AssetsPath from "../Global/AssetsPath";
import useThemeColors from "../Hooks/useThemeMode";

interface FullScreenMessageModalProps {
  isVisible: boolean;
  onClose: () => void;
  themeColor: string;
  backgroundColor: string;
  message: string;
  onChangeText: (text: string) => void;
}

const FullScreenMessageModal: FC<FullScreenMessageModalProps> = ({
  isVisible,
  onClose,
  themeColor,
  backgroundColor,
  message,
  onChangeText,
}) => {
  const colors = useThemeColors();

  return (
    <ReactNativeModal
      isVisible={isVisible}
      animationIn="fadeInUp"
      animationInTiming={800}
      animationOutTiming={800}
      hideModalContentWhileAnimating
      animationOut="fadeOutDown"
      customBackdrop={
        <Pressable style={styles.customBackdrop} onPress={onClose} />
      }
      hasBackdrop
      useNativeDriver={true}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      style={styles.modalContainer}
      backdropOpacity={0.5}
    >
      <View style={styles.mainContainer}>
        <View style={[styles.listHeaderView, { backgroundColor }]}>
          <Pressable onPress={onClose}>
            <Image
              resizeMode="contain"
              tintColor={colors.text}
              source={AssetsPath.ic_minimize}
              style={styles.fullScreenIcon}
            />
          </Pressable>
        </View>
        <TextInput
          multiline
          spellCheck
          scrollEnabled
          value={message}
          onChangeText={onChangeText}
          selectionColor={themeColor}
          textAlignVertical="top"
          placeholder="Message"
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.textInputStyle,
            {
              padding: 10,
              height: "100%",
              color: colors.text,
              backgroundColor: colors.scheduleReminderCardBackground,
            },
          ]}
        />
      </View>
    </ReactNativeModal>
  );
};

export default memo(FullScreenMessageModal);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 0,
    margin: 0,
    height: "100%",
    width: "100%",
  },
  mainContainer: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  listHeaderView: {
    height: "10%",
    width: "100%",
    paddingHorizontal: 10,
    justifyContent: "center",
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  fullScreenIcon: {
    width: 35,
    height: 35,
  },
  customBackdrop: {
    backgroundColor: "rgba(48, 51, 52, 0.9)",
    opacity: 0.5,
    flex: 1,
  },
  textInputStyle: {
    flex: 1,
    fontSize: 18,
    paddingVertical: 15,
  },
});

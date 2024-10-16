import React, { FC, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import ReactNativeModal from "react-native-modal";
import AssetsPath from "../Global/AssetsPath";
import { FONTS } from "../Global/Theme";
import useThemeColors from "../Theme/useThemeMode";
import { BlurView } from "expo-blur";

interface RateUsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const ImageArray = [AssetsPath.ic_happy, AssetsPath.ic_mid, AssetsPath.ic_sad];

const RateUsModal: FC<RateUsModalProps> = ({ isVisible, onClose }) => {
  const colors = useThemeColors();
  const style = styles(colors);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleEmojiSelect = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <ReactNativeModal
      isVisible={isVisible}
      animationIn="fadeIn"
      animationInTiming={300}
      animationOutTiming={300}
      hideModalContentWhileAnimating
      animationOut="fadeOut"
      customBackdrop={
        <Pressable style={style.customBackdrop} onPress={onClose}>
          <BlurView
            style={style.customBackdrop}
            intensity={15}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
          />
        </Pressable>
      }
      hasBackdrop
      useNativeDriver={true}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      style={style.modalContainer}
      backdropOpacity={1}
      useNativeDriverForBackdrop
      removeClippedSubviews
    >
      <View style={style.mainContainer}>
        <View style={style.rateUsViewContainer}>
          <Text style={style.rateUsTitle}>Rate Us!</Text>
          <View style={style.emojiContainer}>
            {ImageArray.map((emoji, index) => (
              <Pressable
                key={index}
                onPress={() => handleEmojiSelect(index)}
                style={[
                  style.emojiWrapper,
                  selectedIndex === index && style.selectedEmojiBackground,
                ]}
              >
                <Image source={emoji} style={style.emoji} />
              </Pressable>
            ))}
          </View>
          <View style={style.buttonContainer}>
            <Pressable style={style.cancelButton} onPress={onClose}>
              <Text style={[style.buttonText, { color: "red" }]}>Cancel</Text>
            </Pressable>
            <Pressable style={style.submitButton}>
              <Text style={style.buttonText}>Submit</Text>
            </Pressable>
          </View>
          <Pressable onPress={onClose}>
            <Text style={style.noThanks}>No thank's</Text>
          </Pressable>
        </View>
      </View>
    </ReactNativeModal>
  );
};

const styles = (colors: any) =>
  StyleSheet.create({
    modalContainer: {
      margin: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    mainContainer: {
      width: "75%",
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 20,

      // shadowColor: "rgba(64, 93, 240, 1)",
      // shadowOffset: {
      //   width: 0,
      //   height: -20,
      // },
      // shadowOpacity: 1,
      // shadowRadius: 4,
      // elevation: 15,
    },
    rateUsViewContainer: {
      alignItems: "center",
      shadowColor: "red",
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.34,
      shadowRadius: 6.27,

      elevation: 10,
    },
    rateUsTitle: {
      fontFamily: FONTS.Medium,
      fontSize: 20,
      color: colors.black,
      marginBottom: 20,
    },
    emojiContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      width: "100%",
      marginBottom: 25,
    },
    emojiWrapper: {
      padding: 10,
      borderRadius: 500,
    },
    selectedEmojiBackground: {
      backgroundColor: "rgba(122, 129, 218, 0.25)",
      borderRadius: 500,
    },
    emoji: {
      width: 38,
      height: 38,
      resizeMode: "contain",
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 10,
      marginTop: 15,
    },
    cancelButton: {
      backgroundColor: "rgba(217, 217, 217, 0.5)",
      padding: 10,
      borderRadius: 15,
      flex: 1,
      marginRight: 5,
      alignItems: "center",
    },
    submitButton: {
      backgroundColor: colors.blue,
      padding: 10,
      borderRadius: 15,
      flex: 1,
      marginLeft: 5,
      alignItems: "center",
    },
    buttonText: {
      fontSize: 17.5,
      color: colors.white,
      fontFamily: FONTS.SemiBold,
    },
    noThanks: {
      color: "rgba(106, 107, 107, 1)",
      fontFamily: FONTS.Medium,
      marginTop: 10,
      fontSize: 17,
    },
    customBackdrop: {
      flex: 1,
      backgroundColor: "rgba(48, 51, 52, 0.8)",
    },
  });

export default RateUsModal;

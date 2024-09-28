import React, { memo, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import AssetsPath from "../Global/AssetsPath";
import useThemeColors from "../Theme/useThemeMode";
import { useAppContext } from "../Contexts/ThemeProvider";

interface CustomSwitchProps {
  isOn: boolean;
  onToggle: (state: boolean) => void;
  width?: number;
  height?: number;
  iconSize?: number;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({
  isOn,
  onToggle,
  width = 70,
  height = 35,
  iconSize = 20,
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  const circleSize = height - 4;
  const translateX = useSharedValue(isOn ? width - circleSize - 2 : 2);

  useEffect(() => {
    translateX.value = isOn
      ? withTiming(width - circleSize - 2, { duration: 400 })
      : withTiming(2, { duration: 400 });
  }, [isOn, translateX, width, circleSize]);

  const toggleSwitch = () => {
    const newValue = !isOn;
    onToggle(newValue);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: colors.primary,
  }));

  const backgroundColor = useAnimatedStyle(() => ({
    backgroundColor:
      theme === "dark" ? colors.grayBackground : colors.lightGray,
  }));

  const styles = getStyles(width, height, circleSize, iconSize);

  return (
    <TouchableWithoutFeedback onPress={toggleSwitch}>
      <Animated.View style={[styles.switchContainer, backgroundColor]}>
        <View style={styles.iconContainer}>
          <Image
            source={AssetsPath.ic_darkTheme}
            tintColor={theme === "dark" ? colors.white : colors.lightGray}
            style={styles.iconStyle}
          />
        </View>
        <Animated.View style={[styles.circle, animatedStyle]} />
        <View style={styles.iconContainer}>
          <Image
            tintColor={colors.white}
            source={AssetsPath.ic_lightTheme}
            style={styles.iconStyle}
          />
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const getStyles = (
  width: number,
  height: number,
  circleSize: number,
  iconSize: number
) =>
  StyleSheet.create({
    switchContainer: {
      width: width,
      height: height,
      borderRadius: height / 2,
      padding: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    circle: {
      width: circleSize,
      height: circleSize,
      borderRadius: circleSize / 2,
      backgroundColor: "#fff",
      position: "absolute",
    },
    iconContainer: {
      zIndex: 9999,
      width: circleSize,
      alignItems: "center",
      justifyContent: "center",
    },
    iconStyle: {
      width: iconSize,
      height: iconSize,
      resizeMode: "contain",
    },
  });

export default memo(CustomSwitch);

import React, { memo, useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import AssetsPath from "../../../Global/AssetsPath";
import useThemeColors from "../../../Theme/useThemeMode";
import TextString from "../../../Global/TextString";
import { FONTS, SIZE } from "../../../Global/Theme";
import CustomSwitch from "../../../Components/CustomSwitch";

interface IHomeHeaderProps {
  hideGrid?: boolean;
}

const HomeHeader = ({ hideGrid }: IHomeHeaderProps) => {
  const { theme, toggleTheme } = useAppContext();
  const colors = useThemeColors();
  const [isSwitchOn, setIsSwitchOn] = useState(theme !== "dark");

  useEffect(() => {
    const setValue = theme !== "dark";
    setIsSwitchOn(setValue);
  }, [theme]);

  const handleToggle = useCallback(
    (state: boolean) => {
      setIsSwitchOn(state);
      toggleTheme(state ? "light" : "dark");
    },
    [toggleTheme]
  );

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.container}>
        <View
          style={[
            styles.menuIconView,
            {
              backgroundColor: hideGrid ? "transparent" : colors.grayBackground,
            },
          ]}
        >
          {!hideGrid && (
            <Image source={AssetsPath.ic_menu} style={styles.menuIcon} />
          )}
        </View>
        <Text style={[styles.titleText, { color: colors.text }]}>
          {TextString.DailySync}
        </Text>
        <CustomSwitch isOn={isSwitchOn} onToggle={handleToggle} />
      </View>
    </Animated.View>
  );
};

export default memo(HomeHeader);

const styles = StyleSheet.create({
  container: {
    width: SIZE.appContainWidth,
    paddingVertical: 10,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuIconView: {
    width: 28,
    height: 28,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  titleText: {
    left: 10,
    fontSize: 24,
    fontFamily: FONTS.Medium,
  },
});

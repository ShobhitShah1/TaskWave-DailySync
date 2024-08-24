import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import AssetsPath from "../../../Global/AssetsPath";
import useThemeColors from "../../../Theme/useThemeMode";
import TextString from "../../../Global/TextString";
import { FONTS } from "../../../Global/Theme";
import CustomSwitch from "../../../Components/CustomSwitch";

const HomeHeader = () => {
  const { theme, toggleTheme } = useAppContext();
  const colors = useThemeColors();
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const handleToggle = (state: boolean) => {
    setIsSwitchOn(state);
    toggleTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      <View style={styles.container}>
        <View
          style={[
            styles.menuIconView,
            { backgroundColor: colors.grayBackground },
          ]}
        >
          <Image source={AssetsPath.ic_menu} style={styles.menuIcon} />
        </View>
        <View style={styles.titleTextView}>
          <Text style={[styles.titleText, { color: colors.text }]}>
            {TextString.DailySync}
          </Text>
        </View>
        <View>
          <CustomSwitch isOn={isSwitchOn} onToggle={handleToggle} />
        </View>
      </View>
    </Animated.View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  container: {
    width: "90%",
    padding: 10,
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
  titleTextView: {
    left: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontSize: 24,
    fontFamily: FONTS.Medium,
  },
});

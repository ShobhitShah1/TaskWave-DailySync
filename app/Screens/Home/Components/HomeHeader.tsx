import { useNavigation } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import CustomSwitch from "../../../Components/CustomSwitch";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import AssetsPath from "../../../Constants/AssetsPath";
import TextString from "../../../Constants/TextString";
import { FONTS, SIZE } from "../../../Constants/Theme";
import useThemeColors from "../../../Hooks/useThemeMode";

interface IHomeHeaderProps {
  hideGrid?: boolean;
  title?: string;
  hideThemeButton?: boolean;
  onBackPress?: () => void;
  hideBackButton?: boolean;
}

const HomeHeader = ({
  hideGrid,
  title,
  hideThemeButton = false,
  onBackPress,
  hideBackButton = true,
}: IHomeHeaderProps) => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { theme, toggleTheme, viewMode, toggleViewMode } = useAppContext();
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
            <Pressable
              onPress={() =>
                toggleViewMode(viewMode === "grid" ? "list" : "grid")
              }
            >
              <Image source={AssetsPath.ic_menu} style={styles.menuIcon} />
            </Pressable>
          )}
          {hideGrid && hideThemeButton && !hideBackButton && (
            <Pressable
              onPress={() =>
                onBackPress
                  ? onBackPress()
                  : navigation.navigate("BottomTab", { screen: "Home" })
              }
              style={styles.backButton}
            >
              <Image
                source={AssetsPath.ic_leftArrow}
                tintColor={colors.text}
                style={styles.menuIcon}
              />
            </Pressable>
          )}
        </View>
        <Text style={[styles.titleText, { color: colors.text }]}>
          {title || TextString.DailySync}
        </Text>
        <View style={{ width: 70, height: 35 }}>
          {!hideThemeButton && (
            <CustomSwitch isOn={isSwitchOn} onToggle={handleToggle} />
          )}
        </View>
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
    left: 17,
    fontSize: 24,
    fontFamily: FONTS.Medium,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});

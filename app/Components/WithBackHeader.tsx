import { useNavigation } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAppContext } from "../Contexts/ThemeProvider";
import AssetsPath from "../Constants/AssetsPath";
import { FONTS, SIZE } from "../Constants/Theme";
import useThemeColors from "../Hooks/useThemeMode";
import CustomSwitch from "./CustomSwitch";

interface IHomeHeaderProps {
  title: string;
  hideSwitch?: boolean;
}

const WithBackHeader = ({ title, hideSwitch }: IHomeHeaderProps) => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { theme, toggleTheme } = useAppContext();
  const [isSwitchOn, setIsSwitchOn] = useState(theme !== "dark");

  useEffect(() => {
    const setValue = theme !== "dark";
    setIsSwitchOn(setValue);
  }, [theme, isSwitchOn]);

  const handleToggle = useCallback(
    (state: boolean) => {
      setIsSwitchOn(state);
      toggleTheme(state ? "light" : "dark");
    },
    [toggleTheme, isSwitchOn]
  );

  return (
    <Animated.View style={styles.container} entering={FadeIn.duration(400)}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.menuIconView]}
      >
        <Image
          tintColor={colors.text}
          source={AssetsPath.ic_leftArrow}
          style={styles.menuIcon}
        />
      </Pressable>
      <View style={{ width: "71%" }}>
        <Text style={[styles.titleText, { color: colors.text }]}>{title}</Text>
      </View>
      <View
        style={{
          width: "18%",
          height: hideSwitch ? 33 : undefined,
          justifyContent: "center",
          alignSelf: "flex-end",
        }}
      >
        {!hideSwitch && (
          <CustomSwitch
            isOn={isSwitchOn}
            onToggle={(state: boolean) => {
              handleToggle(state);
            }}
          />
        )}
      </View>
    </Animated.View>
  );
};

export default memo(WithBackHeader);

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
    width: "10%",
    height: 28,
    borderRadius: 5,
    justifyContent: "center",
  },
  menuIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  titleText: {
    fontSize: 22.5,
    fontFamily: FONTS.Medium,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});

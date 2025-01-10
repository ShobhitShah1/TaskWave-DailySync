import React, { FC, memo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AssetsPath from "../../../Constants/AssetsPath";
import { FONTS } from "../../../Constants/Theme";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import useThemeColors from "../../../Hooks/useThemeMode";

interface SettingProps {
  icon: number;
  title: string;
  onPress: () => void;
}

const SettingItem: FC<SettingProps> = ({ icon, title, onPress }) => {
  const style = styles();
  const { theme } = useAppContext();
  const colors = useThemeColors();

  return (
    <Pressable style={style.itemContainer} onPress={onPress}>
      <View style={style.iconContainer}>
        <Image
          source={icon}
          tintColor={theme === "dark" ? colors.white : colors.black}
          style={style.icon}
          resizeMode="contain"
        />
      </View>
      <Text style={style.title}>{title}</Text>
      <Image
        resizeMode="contain"
        source={AssetsPath.ic_leftArrow}
        tintColor={theme === "dark" ? colors.white : colors.black}
        style={[style.arrow, { transform: [{ rotate: "180deg" }] }]}
      />
    </Pressable>
  );
};

const styles = () => {
  const { theme } = useAppContext();
  const colors = useThemeColors();

  return StyleSheet.create({
    itemContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 15,
      alignSelf: "center",
      borderWidth: 0.5,
      backgroundColor:
        theme === "dark" ? "rgba(43, 43, 44, 1)" : "rgba(251, 252, 255, 1)",
      borderColor:
        theme === "dark" ? "rgba(99, 99, 99, 1)" : "rgba(211, 218, 252, 1)",
    },
    iconContainer: {
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: 22,
      height: 22,
    },
    title: {
      flex: 1,
      marginLeft: 10,
      color: colors.text,
      fontSize: 16.5,
      fontFamily: FONTS.Medium,
      justifyContent: "center",
      alignItems: "center",
    },
    arrow: {
      width: 17,
      height: 17,
      right: 5,
    },
  });
};

export default memo(SettingItem);

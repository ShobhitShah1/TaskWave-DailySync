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
          tintColor={theme === "dark" ? colors.white : undefined}
          style={style.icon}
        />
      </View>
      <Text style={style.title}>{title}</Text>
      <Image
        resizeMode="contain"
        source={AssetsPath.ic_leftArrow}
        style={[
          style.arrow,
          {
            transform: [
              { rotate: title === "Notification" ? "180deg" : "-90deg" },
            ],
          },
        ]}
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
      backgroundColor:
        theme === "dark"
          ? "rgba(43, 43, 44, 1)"
          : colors.reminderCardBackground,

      borderWidth: 0.5,
      borderColor: theme === "dark" ? "rgba(99, 99, 99, 1)" : "transparent",
    },
    iconContainer: {
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    icon: {
      width: 24,
      height: 24,
    },
    title: {
      flex: 1,
      marginLeft: 10,
      color: colors.white,
      fontSize: 17.5,
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

import React, { memo, useEffect } from "react";
import { Image, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import useNotificationIconColors from "../../../Hooks/useNotificationIconColors";
import { NotificationType } from "../../../Types/Interface";
import styles from "../styles";
import useThemeColors from "../../../Hooks/useThemeMode";

interface FilterButtonProps {
  data: any;
  selectedFilter: NotificationType | "all";
  onPress: () => void;
  backgroundColor: string;
}

export const FilterButton = memo(
  ({ onPress, data, selectedFilter, backgroundColor }: FilterButtonProps) => {
    const style = styles();
    const colors = useThemeColors();
    const { theme } = useAppContext();

    const isSelected = selectedFilter === data?.type;
    const scale = useSharedValue(isSelected ? 1.05 : 1);
    const notificationColors = useNotificationIconColors(data?.type);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    useEffect(() => {
      scale.value = withSpring(isSelected ? 1.05 : 1);
    }, [isSelected]);

    return (
      <Pressable onPress={onPress} style={{ right: 2, overflow: "visible" }}>
        <Animated.View
          style={[
            style.filterBtn,
            {
              backgroundColor: isSelected
                ? notificationColors.backgroundColor || "#DDEEFF"
                : backgroundColor,
              // borderColor: isSelected
              //   ? notificationColors.createViewColor || "#3366FF"
              //   : "transparent",
              // borderWidth: 1.5,
              shadowColor: isSelected ? "#000" : "transparent",
              shadowOffset: { width: 0, height: isSelected ? 2 : 0 },
              shadowOpacity: isSelected ? 0.3 : 0,
              shadowRadius: isSelected ? 4 : 0,
              opacity:
                theme === "dark" && isSelected
                  ? 1
                  : theme === "light"
                  ? 1
                  : 0.5,
            },
            animatedStyle,
          ]}
        >
          <Image
            source={isSelected ? data?.glowIcon : data?.icon}
            tintColor={
              selectedFilter !== "gmail" && data.type === "gmail"
                ? colors.white
                : undefined
            }
            style={[
              style.filterIcon,
              {
                width: isSelected ? "130%" : "50%",
                height: isSelected ? "130%" : "50%",
              },
            ]}
          />
        </Animated.View>
      </Pressable>
    );
  }
);

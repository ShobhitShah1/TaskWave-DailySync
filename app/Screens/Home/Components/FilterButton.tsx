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

interface FilterButtonProps {
  filterType: NotificationType | "all";
  selectedFilter: NotificationType | "all";
  onPress: () => void;
  icon: any;
  backgroundColor: string;
}

export const FilterButton = memo(
  ({
    icon,
    onPress,
    filterType,
    selectedFilter,
    backgroundColor,
  }: FilterButtonProps) => {
    const style = styles();
    const { theme } = useAppContext();

    const isSelected = selectedFilter === filterType;
    const scale = useSharedValue(isSelected ? 1.05 : 1);
    const notificationColors = useNotificationIconColors(filterType);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    useEffect(() => {
      scale.value = withSpring(isSelected ? 1.1 : 1);
    }, [isSelected]);

    return (
      <Pressable onPress={onPress} style={{ right: 2 }}>
        <Animated.View
          style={[
            style.filterBtn,
            {
              backgroundColor: isSelected
                ? notificationColors.backgroundColor || "#DDEEFF"
                : backgroundColor,
              borderColor: isSelected
                ? notificationColors.createViewColor || "#3366FF"
                : "transparent",
              borderWidth: 1.5,
              shadowColor: isSelected ? "#000" : "transparent",
              shadowOffset: { width: 0, height: isSelected ? 2 : 0 },
              shadowOpacity: isSelected ? 0.3 : 0,
              shadowRadius: isSelected ? 4 : 0,
              overflow: "visible",
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
            source={icon}
            tintColor={
              selectedFilter === "gmail"
                ? undefined
                : filterType === "gmail"
                ? "white"
                : isSelected
                ? notificationColors.createViewColor
                : "white"
            }
            style={style.filterIcon}
          />
        </Animated.View>
      </Pressable>
    );
  }
);

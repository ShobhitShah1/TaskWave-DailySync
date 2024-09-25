import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View, Dimensions } from "react-native";
import Animated from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS } from "../../Global/Theme";
import useThemeColors from "../../Theme/useThemeMode";
import { TabBarIcon } from "../BottomTab";

const { width } = Dimensions.get("window");

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  indicatorPosition: any;
  onAddReminderPress: () => void;
  onTabChange: (index: number) => void;
  tabWidth: number;
  shouldShowTabBar: boolean;
}

const WIDTH = Dimensions.get("window").width;
const HEIGHT = 60;
const CORNER_RADIUS = 15;
const CUTOUT_RADIUS = 32;
const CUTOUT_LEFT_X = WIDTH / 2 - CUTOUT_RADIUS;
const CUTOUT_RIGHT_X = WIDTH / 2 + CUTOUT_RADIUS;
const SMOOTH_FACTOR = 0.3; // Adjust this value to control the smoothness

const d = `
    M0,${HEIGHT}
    L0,${CORNER_RADIUS} Q0,0 ${CORNER_RADIUS},0
    L${CUTOUT_LEFT_X - SMOOTH_FACTOR * CUTOUT_RADIUS},0
    Q${CUTOUT_LEFT_X},0 ${CUTOUT_LEFT_X},${SMOOTH_FACTOR * CUTOUT_RADIUS}
    A${CUTOUT_RADIUS},${CUTOUT_RADIUS} 0 0 0 ${CUTOUT_RIGHT_X},${SMOOTH_FACTOR * CUTOUT_RADIUS - 20}
    Q${CUTOUT_RIGHT_X},0 ${CUTOUT_RIGHT_X + SMOOTH_FACTOR * CUTOUT_RADIUS},0
    L${WIDTH - CORNER_RADIUS},0 Q${WIDTH},0 ${WIDTH},${CORNER_RADIUS}
    L${WIDTH},${HEIGHT}
    Q${WIDTH},${HEIGHT} 0,${HEIGHT}
    Z
`;

// const d = `
//     M0,${HEIGHT}
//     L0,${CORNER_RADIUS} Q0,0 ${CORNER_RADIUS},0
//     L${CUTOUT_LEFT_X - SMOOTH_FACTOR * CUTOUT_RADIUS},0
//     Q${CUTOUT_LEFT_X},0 ${CUTOUT_LEFT_X},${SMOOTH_FACTOR * CUTOUT_RADIUS}
//     A${CUTOUT_RADIUS},${CUTOUT_RADIUS} 0 0 0 ${CUTOUT_RIGHT_X},${SMOOTH_FACTOR * CUTOUT_RADIUS - 20}
//     Q${CUTOUT_RIGHT_X},0 ${CUTOUT_RIGHT_X + SMOOTH_FACTOR * CUTOUT_RADIUS},0
//     L${WIDTH - CORNER_RADIUS},0 Q${WIDTH},0 ${WIDTH},${CORNER_RADIUS}
//     L${WIDTH},${HEIGHT}
//     Q${WIDTH},${HEIGHT} 0,${HEIGHT}
//     Z
//     `;
export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  indicatorPosition,
  onAddReminderPress,
  onTabChange,
  tabWidth,
  shouldShowTabBar,
}) => {
  const colors = useThemeColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          display: shouldShowTabBar ? "flex" : "none",
        },
      ]}
    >
      <Svg width={width} height={60} style={StyleSheet.absoluteFill}>
        <Path d={d} fill={colors.bottomTab} />
      </Svg>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = useCallback(() => {
            if (label === "AddReminder") {
              onAddReminderPress();
            } else {
              onTabChange(index);

              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }
          }, [
            index,
            isFocused,
            label,
            navigation,
            onAddReminderPress,
            onTabChange,
            route.key,
            route.name,
          ]);

          let iconSource;
          switch (route.name) {
            case "Home":
              iconSource = AssetsPath.ic_fillHome;
              break;
            case "Notification":
              iconSource = AssetsPath.ic_unFillNotification;
              break;
            case "History":
              iconSource = AssetsPath.ic_unFillHistory;
              break;
            case "Setting":
              iconSource = AssetsPath.ic_unFillSetting;
              break;
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tabButton, { width: tabWidth }]}
            >
              {label !== "AddReminder" && (
                <>
                  <TabBarIcon source={iconSource} focused={isFocused} />
                  <Text style={[styles.tabLabel, { color: colors.white }]}>
                    {label}
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable onPress={onAddReminderPress} style={styles.addReminderButton}>
        <Text style={styles.addReminderText}>+</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 5,
    fontFamily: FONTS.Medium,
  },
  addReminderButton: {
    position: "absolute",
    top: -30,
    left: "50%",
    transform: [{ translateX: -28 }],
    backgroundColor: "#007AFF",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  addReminderText: {
    color: "#fff",
    fontSize: 30,
  },
});

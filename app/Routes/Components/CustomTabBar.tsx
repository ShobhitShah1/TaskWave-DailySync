import { useCallback } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS } from "../../Global/Theme";
import useThemeColors from "../../Theme/useThemeMode";
import { TabBarIcon } from "../BottomTab";

export const CustomTabBar = ({
  state,
  descriptors,
  navigation,
  indicatorPosition,
  onAddReminderPress,
  onTabChange,
  tabWidth,
  shouldShowTabBar,
}: any) => {
  const colors = useThemeColors();
  const width = Dimensions.get("window").width;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value + 2 }],
    };
  });

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
      <View style={[styles.tabBar, { backgroundColor: colors.bottomTab }]}>
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

        {/* <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.white },
            animatedStyle,
          ]}
        /> */}
      </View>

      <Pressable onPress={onAddReminderPress} style={styles.addReminderButton}>
        <Text style={styles.addReminderText}>+</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowRadius: 2,
    shadowOffset: { width: 0, height: -10 },
    shadowColor: "#000000",
    elevation: 4,
    shadowOpacity: 1.0,
    // display: "none",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,

    paddingTop: 10,

    shadowRadius: 2,
    shadowOffset: { width: 0, height: -10 },
    shadowColor: "#000000",
    elevation: 4,
    shadowOpacity: 1.0,
  },
  tabButton: {
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 5,
    fontFamily: FONTS.Medium,
  },
  indicator: {
    position: "absolute",
    top: 0,
    width: 35,
    height: 2,
    borderRadius: 2,
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    height: 300,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
});

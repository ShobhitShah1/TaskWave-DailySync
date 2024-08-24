import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import AssetsPath from "../Global/AssetsPath";
import { FONTS } from "../Global/Theme";
import AddReminder from "../Screens/AddReminder/AddReminder";
import History from "../Screens/History/History";
import Home from "../Screens/Home/Home";
import Notification from "../Screens/Notification/Notification";
import Setting from "../Screens/Setting/Setting";
import useThemeColors from "../Theme/useThemeMode";

const Bottom = createBottomTabNavigator();

const TabBarIcon = ({ source, focused }: { source: any; focused: boolean }) => {
  const colors = useThemeColors();
  return (
    <View style={styles.iconContainer}>
      <Image
        source={source}
        resizeMode="contain"
        style={[styles.icon, { tintColor: colors.text }]}
      />
    </View>
  );
};

const CustomTabBar = ({
  state,
  descriptors,
  navigation,
  indicatorPosition,
  onAddReminderPress,
  onTabChange,
  tabWidth,
}: any) => {
  const colors = useThemeColors();
  const screenWidth = Dimensions.get("window").width;
  const tabCount = state.routes.length;

  const totalTabWidth = tabWidth * tabCount;
  const spaceBetweenTabs = (screenWidth - totalTabWidth) / (tabCount + 1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value + 2 }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
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
              android_ripple={{ color: colors.background }}
              style={[styles.tabButton, { width: tabWidth }]}
            >
              {label !== "AddReminder" && (
                <React.Fragment>
                  <TabBarIcon source={iconSource} focused={isFocused} />
                  <Text style={[styles.tabLabel, { color: colors.text }]}>
                    {label}
                  </Text>
                </React.Fragment>
              )}
            </Pressable>
          );
        })}

        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.text },
            animatedStyle,
          ]}
        />
      </View>

      <Pressable onPress={onAddReminderPress} style={styles.addReminderButton}>
        <Text style={styles.addReminderText}>+</Text>
      </Pressable>
    </View>
  );
};

const BottomTab = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const tabWidth = 80;
  const indicatorPosition = useSharedValue(0);

  useEffect(() => {
    indicatorPosition.value = withTiming(selectedIndex * tabWidth + 20, {
      duration: 500,
    });
  }, [selectedIndex]);

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const handleIndexChange = (index: number) => {
    setSelectedIndex(index);
  };

  return (
    <React.Fragment>
      <Bottom.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { borderTopWidth: 0 },
        }}
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            indicatorPosition={indicatorPosition}
            onAddReminderPress={toggleModal}
            onTabChange={handleIndexChange}
            tabWidth={tabWidth}
          />
        )}
      >
        <Bottom.Screen name="Home" component={Home} />
        <Bottom.Screen name="Notification" component={Notification} />
        <Bottom.Screen name="AddReminder" component={AddReminder} />
        <Bottom.Screen name="History" component={History} />
        <Bottom.Screen name="Setting" component={Setting} />
      </Bottom.Navigator>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <AddReminder />
            <Button title="Close" onPress={toggleModal} />
          </View>
        </View>
      </Modal>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    shadowRadius: 2,
    shadowOffset: { width: 0, height: -10 },
    shadowColor: "#000000",
    elevation: 4,
    shadowOpacity: 1.0,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
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
  iconContainer: {
    alignItems: "center",
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

export default BottomTab;

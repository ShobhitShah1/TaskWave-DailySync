import {
  DefaultTheme,
  NavigationContainer,
  Theme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storage, useAppContext } from "../Contexts/ThemeProvider";
import AddReminder from "../Screens/AddReminder/AddReminder";
import ReminderScheduled from "../Screens/AddReminder/ReminderScheduled";
import OnBoarding from "../Screens/OnBoarding/Index";
import ReminderPreview from "../Screens/Preview/ReminderPreview";
import AboutApp from "../Screens/Setting/AboutApp";
import useThemeColors from "../Hooks/useThemeMode";
import { RootStackParamList } from "../Types/Interface";
import BottomTab from "./BottomTab";
import HowAppWorks from "../Screens/Setting/HowAppWorks";
import * as SplashScreen from "expo-splash-screen";
import NotificationSound from "../Screens/Setting/NotificationSound";

const Stack = createNativeStackNavigator<RootStackParamList>();

const Routes = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  const MyTheme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.background,
      card: colors.background,
    },
  };

  const showOnboarding = storage.getString("onboardingShown");

  return (
    <NavigationContainer
      theme={MyTheme}
      onReady={() => {
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 500);
      }}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor={colors.background}
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <Stack.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            animation: "ios",
            navigationBarColor:
              route?.name === "OnBoarding" ? colors.white : colors.bottomTab,
          })}
        >
          {showOnboarding !== "no" && (
            <Stack.Screen name="OnBoarding" component={OnBoarding} />
          )}
          <Stack.Screen name="BottomTab" component={BottomTab} />
          <Stack.Screen name="CreateReminder" component={AddReminder} />
          <Stack.Screen
            name="ReminderScheduled"
            component={ReminderScheduled}
          />
          <Stack.Screen name="ReminderPreview" component={ReminderPreview} />
          <Stack.Screen name="AboutApp" component={AboutApp} />
          <Stack.Screen name="HowAppWorks" component={HowAppWorks} />
          <Stack.Screen
            name="NotificationSound"
            component={NotificationSound}
          />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default Routes;

const styles = StyleSheet.create({
  container: { flex: 1 },
});

import {
  DefaultTheme,
  NavigationContainer,
  Theme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import BottomTab from "./BottomTab";
import { RootStackParamList } from "../Types/Interface";
import useThemeColors from "../Theme/useThemeMode";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, StyleSheet } from "react-native";
import { useAppContext } from "../Contexts/ThemeProvider";
import AddReminder from "../Screens/AddReminder/AddReminder";
import ReminderScheduled from "../Screens/AddReminder/ReminderScheduled";
import ReminderPreview from "../Screens/Preview/ReminderPreview";
import OnBoarding from "../Screens/OnBoarding/Index";

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

  return (
    <NavigationContainer theme={MyTheme}>
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor={colors.background}
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "ios",
            navigationBarColor: colors.background,
          }}
        >
          <Stack.Screen name="OnBoarding" component={OnBoarding} />
          <Stack.Screen name="BottomTab" component={BottomTab} />
          {/* Create Reminder Is Add Reminder Added In Bottom Tab Also */}
          <Stack.Screen name="CreateReminder" component={AddReminder} />
          <Stack.Screen
            name="ReminderScheduled"
            component={ReminderScheduled}
          />
          <Stack.Screen name="ReminderPreview" component={ReminderPreview} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default Routes;

const styles = StyleSheet.create({
  container: { flex: 1 },
});

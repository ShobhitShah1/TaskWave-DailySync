import { NavigationContainer } from "@react-navigation/native";
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

const Stack = createNativeStackNavigator<RootStackParamList>();

const Routes = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  return (
    <NavigationContainer>
      <SafeAreaView style={styles.container}>
        <StatusBar
          translucent
          backgroundColor={colors.background}
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: "ios" }}
        >
          <Stack.Screen name="BottomTab" component={BottomTab} />
          {/* Create Reminder Is Add Reminder Added In Bottom Tab Also */}
          <Stack.Screen name="CreateReminder" component={AddReminder} />
          <Stack.Screen
            name="ReminderScheduled"
            component={ReminderScheduled}
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

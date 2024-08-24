import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import BottomTab from "./BottomTab";
import { RootStackParamList } from "../Types/Interface";
import useThemeColors from "../Theme/useThemeMode";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar, StyleSheet } from "react-native";
import { useAppContext } from "../Contexts/ThemeProvider";

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
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="BottomTab" component={BottomTab} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default Routes;

const styles = StyleSheet.create({
  container: { flex: 1 },
});

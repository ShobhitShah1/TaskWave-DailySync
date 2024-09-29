import notifee, { EventType } from "@notifee/react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { LogBox, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppProvider } from "./app/Contexts/ThemeProvider";
import Routes from "./app/Routes/Routes";
import { handleNotificationPress } from "./app/Hooks/handleNotificationPress";

LogBox.ignoreAllLogs();

export default function App() {
  const [loaded, error] = useFonts({
    "ClashGrotesk-Bold": require("./assets/Fonts/ClashGrotesk-Bold.otf"),
    "ClashGrotesk-Light": require("./assets/Fonts/ClashGrotesk-Light.otf"),
    "ClashGrotesk-Medium": require("./assets/Fonts/ClashGrotesk-Medium.otf"),
    "ClashGrotesk-Regular": require("./assets/Fonts/ClashGrotesk-Regular.otf"),
    "ClashGrotesk-Semibold": require("./assets/Fonts/ClashGrotesk-Semibold.otf"),
  });

  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      console.log("onForegroundEvent");
      switch (type) {
        case EventType.DISMISSED:
          break;
        case EventType.PRESS:
          handleNotificationPress(detail.notification?.data);
          break;
        case EventType.DELIVERED:
          break;
      }
    });
  }, []);

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification } = detail;
    console.log("onBackgroundEvent");

    switch (type) {
      case EventType.DISMISSED:
        break;
      case EventType.PRESS:
        handleNotificationPress(notification?.data);
        break;
      case EventType.DELIVERED:
        break;
    }
  });

  if (!loaded) {
    return;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <AppProvider>
          <Routes />
        </AppProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

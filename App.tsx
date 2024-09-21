import notifee, { EventType } from "@notifee/react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { LogBox, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppProvider } from "./app/Contexts/ThemeProvider";
import { handelNotificationPress } from "./app/Hooks/handelNotificationPress";
import Routes from "./app/Routes/Routes";

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
      switch (type) {
        case EventType.DISMISSED:
          break;
        case EventType.PRESS:
          handelNotificationPress(detail.notification?.data);
          break;
        case EventType.DELIVERED:
          const data = detail.notification?.data;
          if (data?.isRepeat === 1) {
          } else {
            // onDeleteEvent(id);
            // onDeleteNotification(detail.notification?.id);
          }
          break;
      }
    });
  }, []);

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

import notifee, { EventType } from "@notifee/react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { StatusBar, StyleSheet } from "react-native";
import FlashMessage from "react-native-flash-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppProvider } from "./app/Contexts/ThemeProvider";
import { handleNotificationPress } from "./app/Hooks/handleNotificationPress";
import Routes from "./app/Routes/Routes";
import { FONTS } from "./app/Global/Theme";
import useThemeColors from "./app/Theme/useThemeMode";

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification } = detail;

  console.log("Background Notification:", notification);

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

export default function App() {
  const [loaded, error] = useFonts({
    "ClashGrotesk-Bold": require("./assets/Fonts/ClashGrotesk-Bold.otf"),
    "ClashGrotesk-Light": require("./assets/Fonts/ClashGrotesk-Light.otf"),
    "ClashGrotesk-Medium": require("./assets/Fonts/ClashGrotesk-Medium.otf"),
    "ClashGrotesk-Regular": require("./assets/Fonts/ClashGrotesk-Regular.otf"),
    "ClashGrotesk-Semibold": require("./assets/Fonts/ClashGrotesk-Semibold.otf"),
  });

  async function bootstrap() {
    const initialNotification = await notifee.getInitialNotification();

    if (initialNotification) {
      console.log(
        "Notification caused application to open",
        initialNotification.notification.data
      );
      console.log(
        "Press action used to open the app",
        initialNotification.pressAction
      );
      if (initialNotification.notification.data) {
        handleNotificationPress(initialNotification.notification.data);
      }
    }
  }

  useEffect(() => {
    try {
      bootstrap()
        .then(() => {})
        .catch(console.error);
    } catch (error) {
      console.log("Error:", error);
    }
  }, []);

  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
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

  if (!loaded) {
    return;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <AppProvider>
          <Routes />
          <FlashMessage
            position="top"
            titleStyle={styles.flashTextStyle}
            textStyle={[styles.flashTextStyle, { fontSize: 13.5 }]}
            statusBarHeight={StatusBar.currentHeight}
          />
        </AppProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flashTextStyle: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
});

import notifee, { EventType } from "@notifee/react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { LogBox, StatusBar, StyleSheet, Text } from "react-native";
import FlashMessage from "react-native-flash-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppProvider } from "./app/Contexts/ThemeProvider";
import { FONTS } from "./app/Global/Theme";
import { handleNotificationPress } from "./app/Hooks/handleNotificationPress";
import Routes from "./app/Routes/Routes";
import updateToNextDate from "./app/Hooks/updateToNextDate";

interface TextWithDefaultProps extends Text {
  defaultProps?: { allowFontScaling?: boolean };
}

(Text as unknown as TextWithDefaultProps).defaultProps = {
  ...((Text as unknown as TextWithDefaultProps).defaultProps || {}),
  allowFontScaling: false,
};

LogBox.ignoreAllLogs();

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification } = detail;

  if (notification) {
    updateToNextDate(notification);
  }

  switch (type) {
    case EventType.DISMISSED:
      break;
    case EventType.PRESS:
      handleNotificationPress(notification?.data);
      break;
    case EventType.DELIVERED:
      handleNotificationPress(notification?.data);
      break;
    default:
      handleNotificationPress(notification?.data);
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

  if (!loaded || error) {
    return;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <AppProvider>
          <Routes />
          <FlashMessage
            position="top"
            floating={true}
            duration={3500}
            titleStyle={styles.flashTextStyle}
            textStyle={[styles.flashTextStyle, { fontSize: 13.5 }]}
            statusBarHeight={(StatusBar.currentHeight || 20) + 5}
          />
        </AppProvider>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flashTextStyle: {
    fontSize: 17,
    fontFamily: FONTS.SemiBold,
  },
});

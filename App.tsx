import notifee, { EventType } from "@notifee/react-native";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { LogBox, StatusBar, StyleSheet, Text } from "react-native";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppProvider } from "./app/Contexts/ThemeProvider";
import { FONTS } from "./app/Global/Theme";
import { handleNotificationPress } from "./app/Hooks/handleNotificationPress";
import updateToNextDate from "./app/Hooks/updateToNextDate";
import useReminder from "./app/Hooks/useReminder";
import Routes from "./app/Routes/Routes";
import { Notification } from "./app/Types/Interface";

interface TextWithDefaultProps extends Text {
  defaultProps?: { allowFontScaling?: boolean };
}

(Text as unknown as TextWithDefaultProps).defaultProps = {
  ...((Text as unknown as TextWithDefaultProps).defaultProps || {}),
  allowFontScaling: false,
};

LogBox.ignoreAllLogs();

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const notification: Notification = detail.notification?.data as any;

  switch (type) {
    case EventType.DISMISSED:
      break;
    case EventType.PRESS:
      handleNotificationPress(notification);
      break;
    case EventType.DELIVERED:
      if (notification && notification?.scheduleFrequency?.length !== 0) {
        try {
          const { updatedNotification } = await updateToNextDate(notification);

          if (updatedNotification) {
            await useReminder().updateNotification(updatedNotification);
          }
        } catch (error: any) {
          showMessage({
            message: String(error?.message || error),
            type: "danger",
          });
        }
      }
      break;
    default:
      return;
  }
});

export default function App() {
  const { updateNotification } = useReminder();

  const [loaded, error] = useFonts({
    "ClashGrotesk-Bold": require("./assets/Fonts/ClashGrotesk-Bold.otf"),
    "ClashGrotesk-Light": require("./assets/Fonts/ClashGrotesk-Light.otf"),
    "ClashGrotesk-Medium": require("./assets/Fonts/ClashGrotesk-Medium.otf"),
    "ClashGrotesk-Regular": require("./assets/Fonts/ClashGrotesk-Regular.otf"),
    "ClashGrotesk-Semibold": require("./assets/Fonts/ClashGrotesk-Semibold.otf"),
  });

  useEffect(() => {
    return notifee.onForegroundEvent(async ({ type, detail }) => {
      const notification: Notification = detail.notification?.data as any;

      switch (type) {
        case EventType.DISMISSED:
          break;
        case EventType.PRESS:
          handleNotificationPress(notification);
          break;
        case EventType.DELIVERED:
          if (notification && notification?.scheduleFrequency?.length !== 0) {
            try {
              const { updatedNotification } =
                await updateToNextDate(notification);

              if (updatedNotification) {
                await updateNotification(updatedNotification);
              }
            } catch (error: any) {
              showMessage({
                message: String(error?.message || error),
                type: "danger",
              });
            }
          }
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

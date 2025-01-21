import notifee, { EventType } from "@notifee/react-native";
import { useFonts } from "expo-font";
import * as QuickActions from "expo-quick-actions";
import * as ExpoSplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { LogBox, StatusBar, StyleSheet, Text } from "react-native";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { FONTS } from "./app/Constants/Theme";
import { BottomSheetProvider } from "./app/Contexts/BottomSheetProvider";
import { AppProvider } from "./app/Contexts/ThemeProvider";
import { handleNotificationPress } from "./app/Hooks/handleNotificationPress";
import { updateNotification } from "./app/Hooks/updateNotification";
import updateToNextDate from "./app/Hooks/updateToNextDate";
import useReminder from "./app/Hooks/useReminder";
import Routes from "./app/Routes/Routes";
import { Notification } from "./app/Types/Interface";

ExpoSplashScreen.preventAutoHideAsync();

SystemUI.setBackgroundColorAsync("transparent");

if (__DEV__) {
  LogBox.ignoreAllLogs();
}

interface TextWithDefaultProps extends Text {
  defaultProps?: { allowFontScaling?: boolean };
}

(Text as unknown as TextWithDefaultProps).defaultProps = {
  ...((Text as unknown as TextWithDefaultProps).defaultProps || {}),
  allowFontScaling: false,
};

notifee.onBackgroundEvent(async ({ type, detail }) => {
  try {
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
            const { updatedNotification } = await updateToNextDate(
              notification
            );
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

        handleNotificationPress(notification);
        break;
      default:
        return;
    }
  } catch (error: any) {
    showMessage({
      message: String(error?.message || error),
      type: "danger",
    });
  }
});

export default function App() {
  const { updateNotification } = useReminder();

  const [loaded, error] = useFonts({
    "ClashGrotesk-Bold": require("./assets/Fonts/ClashGrotesk-Bold.otf"),
    "ClashGrotesk-Medium": require("./assets/Fonts/ClashGrotesk-Medium.otf"),
    "ClashGrotesk-Regular": require("./assets/Fonts/ClashGrotesk-Regular.otf"),
    "ClashGrotesk-Semibold": require("./assets/Fonts/ClashGrotesk-Semibold.otf"),
  });

  useEffect(() => {
    try {
      notifee
        .getInitialNotification()
        .then(async (res) => {
          if (res?.notification?.data) {
            await handleNotificationPress(res?.notification?.data as any);
            notifee.cancelNotification(res?.notification?.id as string);
          }
        })
        .catch((error) => {
          showMessage({
            message: String(error?.message || error),
            type: "danger",
          });
        });
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
    }
  }, []);

  useEffect(() => {
    return notifee.onForegroundEvent(async ({ type, detail }) => {
      try {
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
                const { updatedNotification } = await updateToNextDate(
                  notification
                );

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
      } catch (error: any) {
        showMessage({
          message: String(error?.message || error),
          type: "danger",
        });
      }
    });
  }, []);

  useEffect(() => {
    QuickActions.setItems([
      {
        title: "Add Reminder",
        subtitle: "Schedule a reminder to take your medication",
        icon: "plus_icon",
        id: "0",
        params: { href: "/schedule" },
      },
      {
        title: "Wait! Don't delete me!",
        subtitle: "We're here to help",
        icon: "wave_icon",
        id: "1",
        params: { href: "/help" },
      },
    ]);
  }, []);

  if (!loaded || error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <AppProvider>
          <BottomSheetProvider>
            <Routes />
            <FlashMessage
              position="top"
              floating={true}
              duration={3500}
              titleStyle={styles.flashTextStyle}
              textStyle={[styles.flashTextStyle, { fontSize: 13.5 }]}
              statusBarHeight={(StatusBar.currentHeight || 20) + 5}
            />
          </BottomSheetProvider>
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

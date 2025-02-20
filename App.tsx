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
import useReminder, {
  RESCHEDULE_CONFIG,
  scheduleNotification,
} from "./app/Hooks/useReminder";
import Routes from "./app/Routes/Routes";
import { Notification } from "./app/Types/Interface";
import { parseNotificationData } from "./app/Utils/notificationParser";

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
        if (notification) {
          const parseData = parseNotificationData(notification);

          const rescheduleInfo = parseData.rescheduleInfo
            ? JSON.parse(
                typeof parseData.rescheduleInfo === "string"
                  ? parseData.rescheduleInfo
                  : JSON.stringify(parseData.rescheduleInfo)
              )
            : null;

          const retryCount = rescheduleInfo?.retryCount || 0;

          if (
            !RESCHEDULE_CONFIG.maxRetries ||
            retryCount < RESCHEDULE_CONFIG.maxRetries
          ) {
            try {
              await scheduleNotification(parseData, {
                isReschedule: true,
                delayMinutes: RESCHEDULE_CONFIG.defaultDelay,
                retryCount: retryCount,
              });
            } catch (error: any) {
              if (!error.message?.includes("invalid notification ID")) {
                showMessage({
                  message: String(error?.message || error),
                  type: "danger",
                });
              }
            }
          }
        }
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
            if (!error.message?.includes("invalid notification ID")) {
              showMessage({
                message: String(error?.message || error),
                type: "danger",
              });
            }
          }
        }

        handleNotificationPress(notification);
        break;
      default:
        return;
    }
  } catch (error: any) {
    if (!error.message?.includes("invalid notification ID")) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
    }
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
          if (!error.message?.includes("invalid notification ID")) {
            showMessage({
              message: String(error?.message || error),
              type: "danger",
            });
          }
        });
    } catch (error: any) {
      if (!error.message?.includes("invalid notification ID")) {
        showMessage({
          message: String(error?.message || error),
          type: "danger",
        });
      }
    }
  }, []);

  useEffect(() => {
    return notifee.onForegroundEvent(async ({ type, detail }) => {
      try {
        const notification: Notification = detail.notification?.data as any;

        switch (type) {
          case EventType.DISMISSED:
            if (notification) {
              const parseData = parseNotificationData(notification);

              const rescheduleInfo = parseData.rescheduleInfo
                ? JSON.parse(
                    typeof parseData.rescheduleInfo === "string"
                      ? parseData.rescheduleInfo
                      : JSON.stringify(parseData.rescheduleInfo)
                  )
                : null;

              const retryCount = rescheduleInfo?.retryCount || 0;

              if (
                !RESCHEDULE_CONFIG.maxRetries ||
                retryCount < RESCHEDULE_CONFIG.maxRetries
              ) {
                try {
                  await scheduleNotification(parseData, {
                    isReschedule: true,
                    delayMinutes: RESCHEDULE_CONFIG.defaultDelay,
                    retryCount: retryCount,
                  });
                } catch (error: any) {
                  if (!error.message?.includes("invalid notification ID")) {
                    showMessage({
                      message: String(error?.message || error),
                      type: "danger",
                    });
                  }
                }
              }
            }
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
                if (!error.message?.includes("invalid notification ID")) {
                  showMessage({
                    message: String(error?.message || error),
                    type: "danger",
                  });
                }
              }
            }
            break;
        }
      } catch (error: any) {
        if (!error.message?.includes("invalid notification ID")) {
          showMessage({
            message: String(error?.message || error),
            type: "danger",
          });
        }
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

// import React, { useState } from "react";
// import { SafeAreaView, StyleSheet, TouchableOpacity, View } from "react-native";
// import Animated, {
//   CurvedTransition,
//   Easing,
//   EntryExitTransition,
//   FadeOut,
//   FadingTransition,
//   FlipInEasyY,
//   FlipOutYLeft,
//   JumpingTransition,
//   LinearTransition,
//   SequencedTransition,
// } from "react-native-reanimated";

// const INITIAL_LIST = [
//   { id: 1, emoji: "🍌", color: "#b58df1" },
//   { id: 2, emoji: "🍎", color: "#ffe780" },
//   { id: 3, emoji: "🥛", color: "#fa7f7c" },
//   { id: 4, emoji: "🍙", color: "#82cab2" },
//   { id: 5, emoji: "🍇", color: "#fa7f7c" },
//   { id: 6, emoji: "🍕", color: "#b58df1" },
//   { id: 7, emoji: "🍔", color: "#ffe780" },
//   { id: 8, emoji: "🍟", color: "#b58df1" },
// ];

// interface TRANSITION {
//   label: string;
//   value: any;
// }

// const LAYOUT_TRANSITIONS = [
//   { label: "Linear Transition", value: LinearTransition },
//   { label: "Sequenced Transition", value: SequencedTransition },
//   { label: "Fading Transition", value: FadingTransition },
//   { label: "Jumping Transition", value: JumpingTransition },
//   {
//     label: "Curved Transition",
//     value: CurvedTransition.easingX(Easing.sin).easingY(Easing.exp),
//   },
//   {
//     label: "Entry/Exit Transition",
//     value: EntryExitTransition.entering(FlipInEasyY).exiting(FlipOutYLeft),
//   },
// ];

// export default function App() {
//   const [items, setItems] = useState(INITIAL_LIST);
//   const [selected, setSelected] = useState(LAYOUT_TRANSITIONS[0]);

//   const removeItem = (idToRemove) => {
//     const updatedItems = items.filter((item) => item.id !== idToRemove);
//     setItems(updatedItems);
//   };

//   const onSelect = (index) => {
//     setSelected(LAYOUT_TRANSITIONS[index]);
//     setItems(INITIAL_LIST);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.dropdownContainer}>
//         {LAYOUT_TRANSITIONS.map((transition, index) => (
//           <TouchableOpacity
//             key={transition.label}
//             style={[
//               styles.transitionButton,
//               selected.label === transition.label && {
//                 backgroundColor: "#4a90e2",
//               },
//             ]}
//             onPress={() => onSelect(index)}
//           >
//             <Animated.Text
//               style={[
//                 styles.buttonText,
//                 selected.label === transition.label && { color: "#fff" },
//               ]}
//             >
//               {transition.label.split(" ")[0]}
//             </Animated.Text>
//           </TouchableOpacity>
//         ))}
//       </View>
//       <View style={styles.mainContainer}>
//         <Items selected={selected} items={items} onRemove={removeItem} />
//       </View>
//     </SafeAreaView>
//   );
// }

// function Items({ selected, items, onRemove }) {
//   // Create a flat layout where we manually position items in a 2x2 grid
//   // This approach preserves the animation context better than nested views
//   return (
//     <Animated.View style={styles.gridContainer}>
//       {items.map((item, index) => {
//         // Calculate row and column positions
//         const row = Math.floor(index / 2);
//         const col = index % 2;

//         return (
//           <Animated.View
//             key={item.id}
//             layout={selected.value}
//             exiting={FadeOut}
//             style={[
//               styles.tileContainer,
//               {
//                 backgroundColor: item.color,
//                 left: col === 0 ? "3%" : "52%",
//                 top: row * 100,
//               },
//             ]}
//           >
//             <Tile emoji={item.emoji} onRemove={() => onRemove(item.id)} />
//           </Animated.View>
//         );
//       })}
//     </Animated.View>
//   );
// }

// function Tile({ emoji, onRemove }) {
//   return (
//     <TouchableOpacity onPress={onRemove} style={styles.tile}>
//       <Animated.Text style={styles.tileLabel}>{emoji}</Animated.Text>
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 32,
//     width: "auto",
//     display: "flex",
//     minHeight: 300,
//   },
//   mainContainer: {
//     flex: 1,
//     position: "relative",
//   },
//   gridContainer: {
//     position: "relative",
//     width: "100%",
//     height: "100%",
//   },
//   dropdownContainer: {
//     display: "flex",
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "center",
//     marginBottom: 16,
//     gap: 8,
//   },
//   transitionButton: {
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     backgroundColor: "#f0f0f0",
//     borderRadius: 8,
//     marginHorizontal: 4,
//     marginBottom: 8,
//   },
//   buttonText: {
//     fontSize: 12,
//     color: "#333",
//   },
//   tileContainer: {
//     width: "45%",
//     aspectRatio: 1,
//     borderRadius: 16,
//     position: "absolute",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   tile: {
//     flex: 1,
//     height: "100%",
//     width: "100%",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   tileLabel: {
//     color: "#f8f9ff",
//     fontSize: 24,
//   },
// });

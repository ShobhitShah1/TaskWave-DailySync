import { FONTS } from '@Constants/Theme';
import notifee, { EventType } from '@notifee/react-native';
import { useFonts } from 'expo-font';
import * as QuickActions from 'expo-quick-actions';
import React, { useEffect } from 'react';
import { LogBox, StatusBar, StyleSheet, Text } from 'react-native';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomSheetProvider } from './app/Contexts/BottomSheetProvider';
import { AppProvider, useAppContext } from './app/Contexts/ThemeProvider';
import { handleNotificationPress } from './app/Hooks/handleNotificationPress';
import { updateNotification } from './app/Hooks/updateNotification';
import updateToNextDate from './app/Hooks/updateToNextDate';
import useReminder, {
  createNotificationChannel,
  scheduleNotification,
} from './app/Hooks/useReminder';
import Routes from './app/Routes/Routes';
import LocationService from './app/Services/LocationService';
import { Notification } from './app/Types/Interface';
import { getDatabase } from './app/Utils/databaseUtils';

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

// Background event handler
notifee.onBackgroundEvent(async ({ type, detail }) => {
  try {
    const notification: Notification = detail.notification?.data as any;

    switch (type) {
      case EventType.DISMISSED:
        // Handle dismissed notifications
        break;
      case EventType.PRESS:
        handleNotificationPress(notification);
        break;
      case EventType.DELIVERED:
        if (notification && notification?.scheduleFrequency?.length !== 0) {
          try {
            const { updatedNotification } = await updateToNextDate(notification);
            if (updatedNotification) {
              await updateNotification(updatedNotification);
            }
          } catch (error: any) {
            if (!error.message?.includes('invalid notification ID')) {
              showMessage({
                message: String(error?.message || error),
                type: 'danger',
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
    if (!error.message?.includes('invalid notification ID')) {
      showMessage({
        message: String(error?.message || error),
        type: 'danger',
      });
    }
  }
});

// Component to handle theme-aware styling
const AppContent = () => {
  const { theme } = useAppContext();
  const { updateNotification, createNotification } = useReminder();

  const [loaded, error] = useFonts({
    'ClashGrotesk-Bold': require('./assets/Fonts/ClashGrotesk-Bold.otf'),
    'ClashGrotesk-Medium': require('./assets/Fonts/ClashGrotesk-Medium.otf'),
    'ClashGrotesk-Regular': require('./assets/Fonts/ClashGrotesk-Regular.otf'),
    'ClashGrotesk-Semibold': require('./assets/Fonts/ClashGrotesk-Semibold.otf'),
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notification channels
        await createNotificationChannel();

        // Handle initial notification
        const initialNotification = await notifee.getInitialNotification();
        if (initialNotification?.notification?.data) {
          await handleNotificationPress(initialNotification.notification.data as any);
          await notifee.cancelNotification(initialNotification.notification.id as string);
        }
      } catch (error: any) {
        if (!error.message?.includes('invalid notification ID')) {
          console.error('App initialization error:', error);
        }
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    // Set up foreground event listener
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      try {
        const notification: Notification = detail.notification?.data as any;

        switch (type) {
          case EventType.DISMISSED:
            // Handle dismissed notifications
            break;
          case EventType.PRESS:
            handleNotificationPress(notification);
            break;
          case EventType.DELIVERED:
            if (notification && notification?.scheduleFrequency?.length !== 0) {
              try {
                const { updatedNotification } = await updateToNextDate(notification);

                if (!updatedNotification) {
                  return;
                }

                const id = updatedNotification.id;

                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const notificationDate = new Date(updatedNotification.date);
                notificationDate.setHours(0, 0, 0, 0);

                if (notificationDate >= now && updatedNotification && updatedNotification.date) {
                  let notificationScheduleId;

                  await createNotificationChannel();

                  if (id) {
                    await updateNotification({
                      ...updatedNotification,
                      id,
                    });
                  } else {
                    notificationScheduleId = await scheduleNotification(updatedNotification);

                    if (notificationScheduleId?.trim()) {
                      const data = {
                        ...updatedNotification,
                        id: notificationScheduleId,
                      };
                      await createNotification(data);
                    }
                  }
                }
              } catch (error: any) {
                if (!error.message?.includes('invalid notification ID')) {
                  showMessage({
                    message: String(error?.message || error),
                    type: 'danger',
                  });
                }
              }
            }
            break;
        }
      } catch (error: any) {
        if (!error.message?.includes('invalid notification ID')) {
          showMessage({
            message: String(error?.message || error),
            type: 'danger',
          });
        }
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const setupQuickActions = async () => {
      try {
        await QuickActions.setItems([
          {
            title: 'Add Reminder',
            subtitle: 'Schedule a reminder to take your medication',
            icon: 'plus_icon',
            id: '0',
            params: { href: '/schedule' },
          },
          {
            title: "Wait! Don't delete me!",
            subtitle: "We're here to help",
            icon: 'wave_icon',
            id: '1',
            params: { href: '/help' },
          },
        ]);

        // Initialize location service
        const initializeLocationService = async () => {
          try {
            // Load existing location reminders from database using the centralized database utility
            const database = await getDatabase();

            const notifications = await database.getAllAsync<any>(
              'SELECT * FROM notifications WHERE type = "location"',
            );
            const locationNotifications = notifications.filter(
              (n: any) => n.latitude && n.longitude,
            );

            locationNotifications.forEach((notification: any) => {
              LocationService.addLocationReminder({
                id: notification.id,
                latitude: notification.latitude,
                longitude: notification.longitude,
                radius: notification.radius || 100,
                title: notification.message || 'Location Reminder',
                message: notification.message || '',
                notification: {
                  ...notification,
                  date: new Date(notification.date),
                  toContact: [],
                  toMail: [],
                  attachments: [],
                  memo: [],
                },
              });
            });
          } catch (error) {
            console.error('Error initializing location service:', error);
          }
        };

        initializeLocationService();
      } catch (error) {
        console.error('Error setting up quick actions:', error);
      }
    };

    setupQuickActions();
  }, []);

  if (!loaded || error) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: theme === 'dark' ? '#303334' : '#ffffff' }]}
    >
      <BottomSheetProvider>
        <SafeAreaView
          style={[styles.container, { backgroundColor: theme === 'dark' ? '#303334' : '#ffffff' }]}
        >
          <Routes />
          <FlashMessage
            animated
            hideOnPress
            position="top"
            statusBarHeight={StatusBar.currentHeight || 10}
            titleStyle={{ fontFamily: FONTS.SemiBold, fontSize: 18 }}
            textStyle={{ fontFamily: FONTS.Medium, fontSize: 15 }}
          />
        </SafeAreaView>
      </BottomSheetProvider>
    </GestureHandlerRootView>
  );
};

export default function App() {
  useEffect(() => {
    getDatabase()
      .then(() => console.log('[App] Database initialized'))
      .catch((err) => console.error('[App] Database init error', err));
  }, []);

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

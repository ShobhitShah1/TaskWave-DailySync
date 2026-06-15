import { FONTS } from '@Constants/Theme';
import { AuthProvider } from '@Contexts/AuthProvider';
import notifee, { EventType } from '@notifee/react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import React, { useEffect } from 'react';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import BatteryOptimizationModal from './app/Components/BatteryOptimizationModal';
import OverlayPermissionModal from './app/Components/OverlayPermissionModal';
import AssetsPath from './app/Constants/AssetsPath';
import { AlarmProvider, useAlarmContext } from './app/Contexts/AlarmProvider';
import { BatteryOptimizationProvider } from './app/Contexts/BatteryOptimizationProvider';
import { BottomSheetProvider } from './app/Contexts/BottomSheetProvider';
import { ContactProvider } from './app/Contexts/ContactProvider';
import { LocationProvider } from './app/Contexts/LocationProvider';
import { SettingsProvider } from './app/Contexts/SettingsProvider';
import { AppProvider, useAppContext } from './app/Contexts/ThemeProvider';
import { handleNotificationPress } from './app/Hooks/handleNotificationPress';
import { updateNotification } from './app/Hooks/updateNotification';
import updateToNextDate from './app/Hooks/updateToNextDate';
import useReminder, { createNotificationChannel } from './app/Hooks/useReminder';
import Routes from './app/Routes/Routes';
import LiveAlarmOverlay from './app/Screens/Alarm/Components/LiveAlarmOverlay';
import LocationService from './app/Services/LocationService';
import { appQueryClient } from './app/Services/QueryClient';
import { handleAlarmEvent } from './app/Services/AlarmProcessor';
import {
  ensureRemoteNotificationChannel,
  subscribeToForegroundRemoteMessages,
} from './app/Services/RemoteNotificationService';
import { LocationReminderStatus, Notification } from './app/Types/Interface';
import { getDatabase } from './app/Utils/databaseUtils';

configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

void Asset.loadAsync([
  AssetsPath.more_app_popup,
  AssetsPath.exit_button,
  AssetsPath.more_app_button,
]).catch(() => undefined);

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

    if (notification?.kind === 'alarm' || notification?.kind === 'alarm-invitation') {
      await handleAlarmEvent(type, detail);
    }

    switch (type) {
      case EventType.DISMISSED:
        // Handle dismissed notifications
        break;
      case EventType.PRESS:
        if (notification?.kind !== 'alarm') {
          handleNotificationPress(notification, detail.notification?.id);
        }
        break;
      case EventType.DELIVERED:
        if (
          notification &&
          notification.kind !== 'alarm' &&
          notification.kind !== 'alarm-invitation' &&
          notification.scheduleFrequency &&
          notification.scheduleFrequency.length !== 0
        ) {
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

        if (notification?.kind !== 'alarm') {
          handleNotificationPress(notification, detail.notification?.id);
        }
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

const AppContent = () => {
  const { theme } = useAppContext();
  const backgroundColor = theme === 'dark' ? '#303334' : '#ffffff';

  const { activeAlarm, setActiveAlarm } = useAlarmContext();

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor }]}>
      <BottomSheetProvider>
        <View style={[styles.container, { backgroundColor }]}>
          <Routes />

          <View pointerEvents="none" style={styles.assetPreloader}>
            <Image
              fadeDuration={0}
              source={AssetsPath.more_app_popup}
              style={styles.preloadImage}
            />
            <Image fadeDuration={0} source={AssetsPath.exit_button} style={styles.preloadImage} />
            <Image
              fadeDuration={0}
              source={AssetsPath.more_app_button}
              style={styles.preloadImage}
            />
          </View>

          <BatteryOptimizationModal />

          <FlashMessage
            animated
            hideOnPress
            position="top"
            statusBarHeight={StatusBar.currentHeight || 10}
            textStyle={{ fontFamily: FONTS.Medium, fontSize: 15 }}
            titleStyle={{ fontFamily: FONTS.SemiBold, fontSize: 18 }}
          />
        </View>
      </BottomSheetProvider>
    </GestureHandlerRootView>
  );
};

export default function App() {
  const { updateNotification, createNotification } = useReminder();

  const [loaded, error] = useFonts({
    'ClashGrotesk-Bold': require('./assets/Fonts/ClashGrotesk-Bold.otf'),
    'ClashGrotesk-Medium': require('./assets/Fonts/ClashGrotesk-Medium.otf'),
    'ClashGrotesk-Regular': require('./assets/Fonts/ClashGrotesk-Regular.otf'),
    'ClashGrotesk-Semibold': require('./assets/Fonts/ClashGrotesk-Semibold.otf'),
  });

  useEffect(() => {
    initializeApp();
    getDatabase();
    initializeLocationService();
  }, []);

  useEffect(() => {
    ensureRemoteNotificationChannel().catch(() => undefined);
    const unsubscribe = subscribeToForegroundRemoteMessages();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      try {
        const notification: Notification = detail.notification?.data as any;

        if (notification?.kind === 'alarm' || notification?.kind === 'alarm-invitation') {
          await handleAlarmEvent(type, detail).catch(console.error);
        }

        switch (type) {
          case EventType.PRESS:
            if (notification?.kind !== 'alarm') {
              handleNotificationPress(notification, detail.notification?.id);
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
  }, [updateNotification]);

  const initializeApp = async () => {
    try {
      await createNotificationChannel();
    } catch (error: any) {
      if (!error.message?.includes('invalid notification ID')) {
        console.error('App initialization error:', error);
      }
    }
  };

  const initializeLocationService = async () => {
    try {
      // Load existing location reminders from database using the centralized database utility
      const database = await getDatabase();

      const notifications = await database.getAllAsync<any>(
        'SELECT * FROM notifications WHERE type = "location"',
      );

      const locationNotifications = notifications.filter(
        (n: any) => n.latitude && n.longitude && (n.status === 'pending' || !n.status),
      );

      LocationService.startRestoringReminders();

      locationNotifications.forEach((notification: any) => {
        LocationService.restoreLocationReminder({
          id: notification.id,
          latitude: Number(notification.latitude),
          longitude: Number(notification.longitude),
          radius: notification.radius || 100,
          title: notification.subject || 'Location Reminder',
          message: notification.message || '',
          createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
          status: notification.status || LocationReminderStatus.Pending,
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

      LocationService.finishRestoringReminders();
    } catch (error) {
      console.error('Error initializing location service:', error);
    }
  };

  if (!loaded || error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={appQueryClient}>
        <AppProvider>
          <AlarmProvider>
            <AuthProvider>
              <SettingsProvider>
                <BatteryOptimizationProvider>
                  <ContactProvider>
                    <LocationProvider>
                      <AppContent />
                    </LocationProvider>
                  </ContactProvider>
                </BatteryOptimizationProvider>
              </SettingsProvider>
            </AuthProvider>
          </AlarmProvider>
        </AppProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  assetPreloader: {
    height: 1,
    opacity: 0,
    position: 'absolute',
    width: 1,
  },
  preloadImage: {
    height: 1,
    width: 1,
  },
});

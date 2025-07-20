import { useCallback } from 'react';
import { showMessage } from 'react-native-flash-message';

import LocationService from '@Services/LocationService';
import { Notification } from '@Types/Interface';
import useLocationPermission from './useLocationPermission';
import useDatabase from './useReminder';

// Helper function to generate unique notification ID
const generateNotificationId = (): string => {
  return `location_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const useLocationNotification = () => {
  const { createNotification } = useDatabase();
  const { requestPermission, requestBackgroundPermission } = useLocationPermission();

  const scheduleLocationNotification = useCallback(
    async (notification: Notification): Promise<string | null> => {
      try {
        // Check and request location permissions
        const hasLocationPermission = await requestPermission();
        if (!hasLocationPermission) {
          throw new Error('Location permission is required for location-based reminders.');
        }

        const hasBackgroundPermission = await requestBackgroundPermission();
        if (!hasBackgroundPermission) {
          throw new Error(
            'Background location permission is required for location-based reminders.',
          );
        }

        // Validate location data
        if (!notification.latitude || !notification.longitude) {
          throw new Error('Location coordinates are required for location-based reminders.');
        }

        if (!notification.radius) {
          notification.radius = 100; // Default 100 meters
        }

        // Generate a unique ID for the location notification
        const notificationId = generateNotificationId();

        // Create notification data with the generated ID
        const notificationData = {
          ...notification,
          id: notificationId,
        };

        // For location-based notifications, we don't need to schedule with Notifee
        // since they trigger based on location proximity, not time
        // Just create the notification in database and add to location service
        const createdId = await createNotification(notificationData);
        if (!createdId) {
          throw new Error('Failed to create location-based notification.');
        }

        // Add to location service for tracking
        LocationService.addLocationReminder({
          id: createdId,
          latitude: notification.latitude,
          longitude: notification.longitude,
          radius: notification.radius,
          title: notification.message || 'Location Reminder',
          message: notification.message || '',
          notification: {
            ...notificationData,
            id: createdId,
          },
        });

        showMessage({
          message: 'Location-based reminder created successfully!',
          description:
            'You will be notified when you are within 100 meters of the selected location.',
          type: 'success',
        });

        return createdId;
      } catch (error: any) {
        showMessage({
          message: String(error?.message || error),
          type: 'danger',
        });
        return null;
      }
    },
    [createNotification, requestPermission, requestBackgroundPermission],
  );

  const removeLocationNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      LocationService.removeLocationReminder(notificationId);
    } catch (error: any) {
      console.error('Error removing location notification:', error);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      return await LocationService.getCurrentLocation();
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: 'danger',
      });
      return null;
    }
  }, []);

  return {
    scheduleLocationNotification,
    removeLocationNotification,
    getCurrentLocation,
  };
};

export default useLocationNotification;

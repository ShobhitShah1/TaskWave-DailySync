/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { check, PERMISSIONS, PermissionStatus, request, RESULTS } from 'react-native-permissions';

const getPlatformLocationPermission = () => {
  if (Platform.OS === 'android') {
    return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  }
  return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
};

const getPlatformBackgroundLocationPermission = () => {
  if (Platform.OS === 'android') {
    return PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
  }
  return PERMISSIONS.IOS.LOCATION_ALWAYS;
};

const useLocationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [backgroundPermissionStatus, setBackgroundPermissionStatus] =
    useState<PermissionStatus | null>(null);

  const checkPermissionStatus = async () => {
    const permission = getPlatformLocationPermission();
    try {
      const result = await check(permission);
      setPermissionStatus(result);
      return await handlePermissionStatus(result);
    } catch (error) {
      return false;
    }
  };

  const checkBackgroundPermissionStatus = async () => {
    const permission = getPlatformBackgroundLocationPermission();
    try {
      const result = await check(permission);
      setBackgroundPermissionStatus(result);
      return result === RESULTS.GRANTED;
    } catch (error) {
      return false;
    }
  };

  const handlePermissionStatus = async (status: PermissionStatus) => {
    switch (status) {
      case RESULTS.UNAVAILABLE:
        showMessage({
          description: 'Location services are not available on your device.',
          message: 'Location Unavailable',
          type: 'danger',
        });
        return false;
      case RESULTS.DENIED:
        return false;
      case RESULTS.GRANTED:
        return true;
      case RESULTS.BLOCKED:
        return false;
      default:
        return false;
    }
  };

  const requestPermission = async () => {
    const permission = getPlatformLocationPermission();
    try {
      const result = await request(permission);
      setPermissionStatus(result);
      if (result === RESULTS.GRANTED) {
        return true;
      } else if (result === RESULTS.BLOCKED) {
        showMessage({
          message:
            'Location permission is required for location-based reminders. Click here to go to settings.',
          type: 'danger',
          duration: 5000,
          onPress: () => Linking.openSettings(),
        });
        return false;
      }
      return false;
    } catch (error: any) {
      showMessage({
        message: `Error requesting location permission: ${String(error?.message || error)}`,
        type: 'danger',
      });
      return false;
    }
  };

  const requestBackgroundPermission = async () => {
    const permission = getPlatformBackgroundLocationPermission();
    try {
      const result = await request(permission);
      setBackgroundPermissionStatus(result);
      if (result === RESULTS.GRANTED) {
        return true;
      } else if (result === RESULTS.BLOCKED) {
        showMessage({
          message:
            'Background location permission is required for location-based reminders. Click here to go to settings.',
          type: 'danger',
          duration: 5000,
          onPress: () => Linking.openSettings(),
        });
        return false;
      }
      return false;
    } catch (error: any) {
      showMessage({
        message: `Error requesting background location permission: ${String(error?.message || error)}`,
        type: 'danger',
      });
      return false;
    }
  };

  return {
    permissionStatus,
    backgroundPermissionStatus,
    checkPermissionStatus,
    checkBackgroundPermissionStatus,
    requestPermission,
    requestBackgroundPermission,
  };
};

export default useLocationPermission;

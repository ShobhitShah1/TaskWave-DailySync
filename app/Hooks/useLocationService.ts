import { useCallback, useEffect, useState } from 'react';
import { showMessage } from 'react-native-flash-message';

import LocationService from '@Services/LocationService';

interface LocationServiceState {
  isTracking: boolean;
  activeRemindersCount: number;
  lastLocation: any;
}

export const useLocationService = () => {
  const [serviceState, setServiceState] = useState<LocationServiceState>({
    isTracking: false,
    activeRemindersCount: 0,
    lastLocation: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateServiceState = useCallback(() => {
    setServiceState({
      isTracking: LocationService.isServiceTracking(),
      activeRemindersCount: LocationService.getActiveRemindersCount(),
      lastLocation: LocationService.getLastLocation(),
    });
  }, []);

  useEffect(() => {
    updateServiceState();
    const interval = setInterval(updateServiceState, 5000);
    return () => clearInterval(interval);
  }, [updateServiceState]);

  const startTracking = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await LocationService.startTracking();
      if (success) {
        showMessage({ message: 'Location tracking started', type: 'success' });
      }
      updateServiceState();
    } catch (error) {
      console.error('Error starting tracking:', error);
      showMessage({
        message: 'Error starting location tracking',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateServiceState]);

  const stopTracking = useCallback(async () => {
    setIsLoading(true);
    try {
      await LocationService.stopTracking();
      showMessage({ message: 'Location tracking stopped', type: 'info' });
      updateServiceState();
    } catch (error) {
      console.error('Error stopping tracking:', error);
      showMessage({
        message: 'Error stopping location tracking',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateServiceState]);

  const getReminders = useCallback(() => {
    return LocationService.getReminders();
  }, []);

  const isAnyServiceRunning = useCallback(() => {
    return LocationService.isServiceTracking() || LocationService.getActiveRemindersCount() > 0;
  }, []);

  return {
    serviceState,
    isLoading,
    startTracking,
    stopTracking,
    getReminders,
    isAnyServiceRunning,
    updateServiceState,
  };
};

export default useLocationService;

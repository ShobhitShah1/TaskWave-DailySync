import { useCallback, useEffect, useState } from 'react';
import { showMessage } from 'react-native-flash-message';

import LocationService from '../Services/LocationService';

interface LocationServiceState {
  isTracking: boolean;
  isPaused: boolean;
  activeRemindersCount: number;
  lastLocation: any;
  serviceStatus: 'running' | 'paused' | 'stopped';
}

export const useLocationService = () => {
  const [serviceState, setServiceState] = useState<LocationServiceState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const updateServiceState = useCallback(() => {
    const state = LocationService.getServiceState();
    const info = LocationService.getServiceInfo();
    setServiceState({ ...state, ...info });
  }, []);

  useEffect(() => {
    // Initial state update
    updateServiceState();

    // Set up periodic updates
    const interval = setInterval(updateServiceState, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [updateServiceState]);

  const startTracking = useCallback(async () => {
    setIsLoading(true);
    try {
      const success = await LocationService.startLocationTracking();
      if (success) {
        showMessage({
          message: 'Location tracking started',
          type: 'success',
        });
      }
      updateServiceState();
    } catch (error) {
      console.error('Error starting tracking:', error);
      showMessage({
        message: 'Error starting location tracking',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateServiceState]);

  const stopTracking = useCallback(async () => {
    setIsLoading(true);
    try {
      await LocationService.stopLocationTracking();
      showMessage({
        message: 'Location tracking stopped',
        type: 'info',
      });
      updateServiceState();
    } catch (error) {
      console.error('Error stopping tracking:', error);
      showMessage({
        message: 'Error stopping location tracking',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateServiceState]);

  const pauseTracking = useCallback(async () => {
    setIsLoading(true);
    try {
      await LocationService.pauseLocationTracking();
      updateServiceState();
    } catch (error) {
      console.error('Error pausing tracking:', error);
      showMessage({
        message: 'Error pausing location tracking',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateServiceState]);

  const resumeTracking = useCallback(async () => {
    setIsLoading(true);
    try {
      await LocationService.resumeLocationTracking();
      updateServiceState();
    } catch (error) {
      console.error('Error resuming tracking:', error);
      showMessage({
        message: 'Error resuming location tracking',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateServiceState]);

  const forceStopAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await LocationService.forceStopAllServices();
      updateServiceState();
    } catch (error) {
      console.error('Error force stopping services:', error);
      showMessage({
        message: 'Error stopping services',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateServiceState]);

  const emergencyStop = useCallback(async () => {
    setIsLoading(true);
    try {
      await LocationService.emergencyStop();
      updateServiceState();
    } catch (error) {
      console.error('Error emergency stopping:', error);
      showMessage({
        message: 'Error emergency stopping',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateServiceState]);

  const testNotification = useCallback(async () => {
    setIsLoading(true);
    try {
      await LocationService.testInteractiveNotification();
      updateServiceState();
    } catch (error) {
      console.error('Error testing notification:', error);
      showMessage({
        message: 'Error testing notification',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  }, [updateServiceState]);

  const getServiceInfo = useCallback(() => {
    return LocationService.getServiceInfo();
  }, []);

  const isAnyServiceRunning = useCallback(() => {
    return LocationService.isAnyServiceRunning();
  }, []);

  const getRunningServicesSummary = useCallback(() => {
    return LocationService.getRunningServicesSummary();
  }, []);

  return {
    serviceState,
    isLoading,
    startTracking,
    stopTracking,
    pauseTracking,
    resumeTracking,
    forceStopAll,
    emergencyStop,
    testNotification,
    getServiceInfo,
    isAnyServiceRunning,
    getRunningServicesSummary,
    updateServiceState,
  };
};

export default useLocationService;

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, PermissionStatus } from 'react-native-permissions';
import * as Location from 'expo-location';
import { showMessage } from 'react-native-flash-message';
import { GeoLatLng } from '@Types/Interface';
import { initializeMapCache } from '@Utils/mapCacheManager';

interface LocationContextType {
  /** Current cached user location */
  userLocation: GeoLatLng | null;
  /** Whether location is being fetched */
  isLoading: boolean;
  /** Current permission status */
  permissionStatus: PermissionStatus | null;
  /** Whether the initial permission check has completed */
  hasCheckedPermission: boolean;
  /** Refresh the cached location */
  refreshLocation: (silent?: boolean) => Promise<GeoLatLng | null>;
  /** Request location permission */
  requestPermission: () => Promise<PermissionStatus>;
  /** Check current permission status */
  checkPermission: () => Promise<PermissionStatus>;
  /** Whether we have a valid cached location (can skip loader) */
  hasCachedLocation: boolean;
}

const LocationContext = createContext<LocationContextType>({
  userLocation: null,
  isLoading: false,
  permissionStatus: null,
  hasCheckedPermission: false,
  refreshLocation: async () => null,
  requestPermission: async () => 'unavailable',
  checkPermission: async () => 'unavailable',
  hasCachedLocation: false,
});

const getPlatformLocationPermission = () => {
  return Platform.OS === 'android'
    ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<GeoLatLng | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);

  /**
   * Check current location permission status
   */
  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      const permission = getPlatformLocationPermission();
      const status = await check(permission);
      setPermissionStatus(status);
      setHasCheckedPermission(true);
      return status;
    } catch (error) {
      console.error('Error checking location permission:', error);
      setHasCheckedPermission(true);
      return 'unavailable';
    }
  }, []);

  /**
   * Request location permission from user
   */
  const requestPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      const permission = getPlatformLocationPermission();
      const status = await request(permission);
      setPermissionStatus(status);
      setHasCheckedPermission(true);

      if (status === RESULTS.BLOCKED) {
        showMessage({
          message: 'Location permission is required for location-based reminders.',
          description: 'Tap here to open settings.',
          type: 'warning',
          duration: 5000,
          onPress: () => Linking.openSettings(),
        });
      }

      return status;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setHasCheckedPermission(true);
      return 'unavailable';
    }
  }, []);

  /**
   * Fetch and cache the current user location
   * @param silent - If true, don't show loading state (for background updates)
   */
  const refreshLocation = useCallback(
    async (silent = false): Promise<GeoLatLng | null> => {
      try {
        // Check permission first
        const status = await checkPermission();
        if (status !== RESULTS.GRANTED) {
          return null;
        }

        if (!silent) {
          setIsLoading(true);
        }

        // Try to get last known position first (faster)
        let location = await Location.getLastKnownPositionAsync({
          maxAge: 60000, // Accept positions up to 1 minute old
          requiredAccuracy: 100, // 100 meters accuracy
        });

        // If no last known position, get current position
        if (!location) {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        if (location) {
          const newLocation: GeoLatLng = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(newLocation);
          return newLocation;
        }

        return null;
      } catch (error) {
        console.error('Error fetching location:', error);
        return null;
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [checkPermission],
  );

  /**
   * Initialize on mount - check permission, fetch location if granted, and setup map cache
   */
  useEffect(() => {
    const initialize = async () => {
      // Initialize map cache early for better tile loading performance
      initializeMapCache();

      const status = await checkPermission();
      if (status === RESULTS.GRANTED) {
        // Silently fetch location if already permitted
        refreshLocation(true);
      }
    };

    initialize();
  }, []);

  const hasCachedLocation = userLocation !== null;

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        isLoading,
        permissionStatus,
        hasCheckedPermission,
        refreshLocation,
        requestPermission,
        checkPermission,
        hasCachedLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

/**
 * Hook to access location context
 */
export const useLocation = () => useContext(LocationContext);

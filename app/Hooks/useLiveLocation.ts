import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

// Usage in your component should be:
// const locationOptions = useMemo(() => ({
//   timeInterval: 10000,
//   distanceInterval: 100,
// }), []);
// const { location: currentLocation, permissionStatus } = useLiveLocation(locationOptions);

export function useLiveLocation(options?: Location.LocationOptions) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>(
    'undetermined',
  );
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const isInitializedRef = useRef(false);

  // Memoize the options to prevent unnecessary re-renders
  const stableOptions = useRef(options);

  // Update stable options only if they actually changed
  useEffect(() => {
    if (JSON.stringify(stableOptions.current) !== JSON.stringify(options)) {
      stableOptions.current = options;
    }
  }, [options]);

  const initializeLocation = useCallback(async () => {
    if (isInitializedRef.current) return;

    let isMounted = true;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isMounted) return;

      setPermissionStatus(status);

      if (status !== 'granted') {
        setError('Location permission not granted');
        return;
      }

      // Clear any previous error
      setError(null);

      // Default options for better performance
      const defaultOptions: Location.LocationOptions = {
        accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced
        timeInterval: 10000, // 10 seconds instead of 0
        distanceInterval: 50, // 50 meters instead of 0
        mayShowUserSettingsDialog: true,
      };

      const finalOptions = { ...defaultOptions, ...stableOptions.current };

      // Get initial location
      const initial = await Location.getCurrentPositionAsync({
        accuracy: finalOptions.accuracy,
        mayShowUserSettingsDialog: finalOptions.mayShowUserSettingsDialog,
      });

      if (isMounted) {
        setLocation(initial);
      }

      // Clean up existing subscription before creating new one
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      // Subscribe to live updates with optimized options
      subscriptionRef.current = await Location.watchPositionAsync(
        finalOptions,
        (newLocation) => {
          if (isMounted) {
            setLocation(newLocation);
          }
        },
        (err) => {
          if (isMounted) {
            const errorMessage =
              typeof err === 'object' && err !== null && 'message' in err
                ? (err as any).message
                : String(err);
            setError(errorMessage);
          }
        },
      );

      isInitializedRef.current = true;
    } catch (err: any) {
      if (isMounted) {
        const errorMessage =
          typeof err === 'object' && err !== null && 'message' in err
            ? (err as any).message
            : String(err);
        setError(errorMessage);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array since we use stableOptions.current

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    initializeLocation().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      isInitializedRef.current = false;
      if (cleanup) cleanup();
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []); // Remove options from dependency array

  // Method to manually refresh location
  const refreshLocation = useCallback(async () => {
    if (permissionStatus !== 'granted') return;

    try {
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
      setLocation(current);
      setError(null);
    } catch (err: any) {
      const errorMessage =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as any).message
          : String(err);
      setError(errorMessage);
    }
  }, [permissionStatus]);

  return {
    location,
    permissionStatus,
    error,
    refreshLocation, // Added manual refresh capability
  };
}

import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export function useLiveLocation(options?: Location.LocationOptions) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>(
    'undetermined',
  );
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);
        if (status !== 'granted') {
          setError('Location permission not granted');
          return;
        }
        // Get initial location
        const initial = await Location.getCurrentPositionAsync(
          options || {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 0,
            mayShowUserSettingsDialog: true,
          },
        );
        if (isMounted) setLocation(initial);

        // Subscribe to live updates
        subscriptionRef.current = await Location.watchPositionAsync(
          options || {
            accuracy: Location.Accuracy.High,
            timeInterval: 0,
            distanceInterval: 0,
            mayShowUserSettingsDialog: true,
          },
          (loc) => {
            if (isMounted) setLocation(loc);
          },
          (err) => {
            if (isMounted)
              setError(
                typeof err === 'object' && err !== null && 'message' in err
                  ? (err as any).message
                  : String(err),
              );
          },
        );
      } catch (err: any) {
        if (isMounted)
          setError(
            typeof err === 'object' && err !== null && 'message' in err
              ? (err as any).message
              : String(err),
          );
      }
    })();
    return () => {
      isMounted = false;
      if (subscriptionRef.current) subscriptionRef.current.remove();
    };
  }, [options]);

  return { location, permissionStatus, error };
}

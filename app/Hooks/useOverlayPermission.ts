import { useEffect, useState, useCallback } from 'react';
import { NativeModules, Platform, AppState } from 'react-native';

export const useOverlayPermission = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(true);
      return true;
    }

    const launcher = NativeModules.AlarmLauncher;
    if (launcher?.canDrawOverlays) {
      const status = await launcher.canDrawOverlays();
      setHasPermission(status);
      return status;
    }

    // Fallback if launcher is missing (should not happen on Android)
    return true;
  }, []);

  useEffect(() => {
    checkPermission();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkPermission();
      }
    });

    return () => subscription.remove();
  }, [checkPermission]);

  const requestPermission = useCallback(() => {
    if (Platform.OS === 'android' && NativeModules.AlarmLauncher?.requestOverlayPermission) {
      NativeModules.AlarmLauncher.requestOverlayPermission();
    }
  }, []);

  return {
    hasPermission,
    checkPermission,
    requestPermission,
  };
};

export default useOverlayPermission;

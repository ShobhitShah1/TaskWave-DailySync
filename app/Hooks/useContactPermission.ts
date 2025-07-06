import { useState } from 'react';
import { Linking, Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { check, PERMISSIONS, PermissionStatus, request, RESULTS } from 'react-native-permissions';

const getPlatformPermission = () => {
  return Platform.OS === 'android' ? PERMISSIONS.ANDROID.READ_CONTACTS : PERMISSIONS.IOS.CONTACTS;
};

const useContactPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);

  const checkPermissionStatus = async () => {
    const permission = getPlatformPermission();
    try {
      const result = await check(permission);
      setPermissionStatus(result);
      return await handlePermissionStatus(result);
    } catch (error) {
      return false;
    }
  };

  const handlePermissionStatus = async (status: PermissionStatus) => {
    switch (status) {
      case RESULTS.UNAVAILABLE:
        showMessage({
          description: 'This feature is not available on your device.',
          message: 'Contacts Unavailable',
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
    const permission = getPlatformPermission();
    try {
      const result = await request(permission);
      setPermissionStatus(result);
      if (result === RESULTS.GRANTED) {
        return true;
      } else if (result === RESULTS.BLOCKED) {
        showMessage({
          message:
            'Contacts permission is required to access your contacts. click here to go to settings',
          type: 'danger',
          duration: 5000,
          onPress: () => Linking.openSettings(),
        });
        return false;
      }
      return false;
    } catch (error: any) {
      showMessage({
        message: `Error requesting contact permission: ${String(error?.message || error)}`,
        type: 'danger',
      });
      return false;
    }
  };

  return { permissionStatus, checkPermissionStatus, requestPermission };
};

export default useContactPermission;

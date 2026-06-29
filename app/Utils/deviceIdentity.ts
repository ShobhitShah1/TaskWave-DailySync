import { storage } from '@Contexts/ThemeProvider';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'auth:device-id';

const createDeviceId = () => {
  const randomPart = Math.random().toString(36).slice(2, 12);
  const timePart = Date.now().toString(36);
  return `device_${timePart}_${randomPart}`;
};

const getStableDeviceId = async () => {
  if (Platform.OS === 'android') {
    const androidId = Application.getAndroidId();
    return androidId ? `android_${androidId}` : null;
  }

  if (Platform.OS === 'ios') {
    const iosId = await Application.getIosIdForVendorAsync();
    return iosId ? `ios_${iosId}` : null;
  }

  return null;
};

export const getOrCreateDeviceId = async () => {
  const stableDeviceId = await getStableDeviceId();

  if (stableDeviceId) {
    storage.set(DEVICE_ID_KEY, stableDeviceId);
    return stableDeviceId;
  }

  const storedDeviceId = storage.getString(DEVICE_ID_KEY);

  if (storedDeviceId) {
    return storedDeviceId;
  }

  const generatedDeviceId = createDeviceId();
  storage.set(DEVICE_ID_KEY, generatedDeviceId);
  return generatedDeviceId;
};

import { useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import {
  check,
  PERMISSIONS,
  PermissionStatus,
  request,
  RESULTS,
} from "react-native-permissions";

const getPlatformPermission = () => {
  return Platform.OS === "android"
    ? PERMISSIONS.ANDROID.READ_CONTACTS
    : PERMISSIONS.IOS.CONTACTS;
};

const useContactPermission = () => {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>(null);

  const checkPermissionStatus = async () => {
    const permission = getPlatformPermission();
    try {
      const result = await check(permission);
      setPermissionStatus(result);
      return await handlePermissionStatus(result);
    } catch (error) {
      console.error("Error checking contact permission:", error);
      return false;
    }
  };

  const handlePermissionStatus = async (status: PermissionStatus) => {
    switch (status) {
      case RESULTS.UNAVAILABLE:
        Alert.alert(
          "Contacts Unavailable",
          "This feature is not available on your device."
        );
        return false;
      case RESULTS.DENIED:
        // Automatically request permission if it's denied
        return await requestPermission();
      case RESULTS.GRANTED:
        // Permission granted, return true
        return true;
      case RESULTS.BLOCKED:
        // Show alert and direct user to settings
        Alert.alert(
          "Contacts Permission Blocked",
          "Contacts permission is blocked. Please enable it in the settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
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
        Alert.alert(
          "Contacts Permission Blocked",
          "Contacts permission is blocked. Please enable it in the settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting contact permission:", error);
      return false;
    }
  };

  return { permissionStatus, checkPermissionStatus, requestPermission };
};

export default useContactPermission;

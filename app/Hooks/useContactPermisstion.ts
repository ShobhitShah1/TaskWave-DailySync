import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import {
  check,
  PERMISSIONS,
  PermissionStatus,
  request,
  RESULTS,
} from "react-native-permissions";

const useContactPermission = (onPermissionGranted: () => void) => {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>(null);

  const checkPermissionStatus = async () => {
    const permission =
      Platform.OS === "android"
        ? PERMISSIONS.ANDROID.READ_CONTACTS
        : PERMISSIONS.IOS.CONTACTS;

    try {
      const result = await check(permission);
      setPermissionStatus(result);
      handlePermissionStatus(result);
    } catch (error) {
      console.log("Error checking contact permission:", error);
    }
  };

  const handlePermissionStatus = async (status: PermissionStatus) => {
    switch (status) {
      case RESULTS.UNAVAILABLE:
        Alert.alert(
          "Contacts Unavailable",
          "This feature is not available on your device."
        );
        break;
      case RESULTS.DENIED:
        await requestPermission();
        break;
      case RESULTS.GRANTED:
        onPermissionGranted();
        break;
      case RESULTS.BLOCKED:
        Alert.alert(
          "Contacts Permission Blocked",
          "Please enable contact permissions in the settings."
        );
        break;
    }
  };

  const requestPermission = async () => {
    const permission =
      Platform.OS === "android"
        ? PERMISSIONS.ANDROID.READ_CONTACTS
        : PERMISSIONS.IOS.CONTACTS;

    try {
      const result = await request(permission);
      setPermissionStatus(result);
      if (result === RESULTS.GRANTED) {
        onPermissionGranted();
      }
    } catch (error) {
      console.log("Error requesting contact permission:", error);
    }
  };

  return { permissionStatus, checkPermissionStatus };
};

export default useContactPermission;

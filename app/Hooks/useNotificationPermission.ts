import { useState, useEffect, useCallback } from "react";
import { Alert, Linking, Platform } from "react-native";
import {
  checkNotifications,
  requestNotifications,
  openSettings,
  PermissionStatus,
} from "react-native-permissions";

const useNotificationPermission = () => {
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus>("unavailable");

  const checkPermission = useCallback(async () => {
    const { status } = await checkNotifications();
    setPermissionStatus(status);

    if (status === "blocked") {
      showBlockedAlert();
    }
  }, []);

  const requestPermission = async () => {
    const { status } = await requestNotifications(["alert", "sound", "badge"]);
    setPermissionStatus(status);

    if (status === "blocked") {
      showBlockedAlert();
    }
  };

  const showBlockedAlert = () => {
    Alert.alert(
      "Notifications Blocked",
      "Notifications are currently blocked. Would you like to open settings to enable them?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: openAppSettings },
      ]
    );
  };

  const openAppSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      openSettings();
    }
  };

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return { permissionStatus, requestPermission, checkPermission };
};

export default useNotificationPermission;

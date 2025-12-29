import notifee from '@notifee/react-native';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { storage } from './ThemeProvider';

// Define PowerManagerInfo type locally (not exported from notifee types)
interface PowerManagerInfo {
  activity?: string | null;
  manufacturer?: string;
  model?: string;
  version?: string;
}

// Storage key for tracking if user has dismissed the modal
const BATTERY_OPTIMIZATION_DISMISSED_KEY = 'battery_optimization_dismissed';
const BATTERY_OPTIMIZATION_LAST_CHECK_KEY = 'battery_optimization_last_check';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface BatteryOptimizationContextType {
  /**
   * Whether battery optimization is enabled (needs to be disabled for reliable notifications)
   */
  isBatteryOptimized: boolean;
  /**
   * Whether the modal is currently visible
   */
  isModalVisible: boolean;
  /**
   * Power manager info from the device
   */
  powerManagerInfo: PowerManagerInfo | null;
  /**
   * Show the battery optimization modal
   */
  showModal: () => void;
  /**
   * Hide the battery optimization modal
   */
  hideModal: () => void;
  /**
   * Check battery optimization status and show modal if needed
   * @param force - If true, show modal even if previously dismissed
   */
  checkAndPrompt: (force?: boolean) => Promise<boolean>;
  /**
   * Open the battery optimization settings
   */
  openBatterySettings: () => Promise<void>;
  /**
   * Open the power manager settings (manufacturer-specific)
   */
  openPowerManagerSettings: () => Promise<void>;
  /**
   * Refresh the battery optimization status
   */
  refreshStatus: () => Promise<void>;
  /**
   * Dismiss the modal for 24 hours (will show again after)
   */
  remindLater: () => void;
}

const BatteryOptimizationContext = createContext<BatteryOptimizationContextType | undefined>(
  undefined,
);

interface BatteryOptimizationProviderProps {
  children: React.ReactNode;
}

export const BatteryOptimizationProvider: React.FC<BatteryOptimizationProviderProps> = ({
  children,
}) => {
  const [isBatteryOptimized, setIsBatteryOptimized] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [powerManagerInfo, setPowerManagerInfo] = useState<PowerManagerInfo | null>(null);
  const hasChecked = useRef(false);

  /**
   * Refresh the battery optimization status
   */
  const refreshStatus = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setIsBatteryOptimized(false);
      return;
    }

    try {
      // Get power manager info for manufacturer-specific settings
      const pmInfo = await notifee.getPowerManagerInfo();
      setPowerManagerInfo(pmInfo);

      // Get notification settings to check if battery optimization is affecting notifications
      const settings = await notifee.getNotificationSettings();

      // Check if the app is battery optimized
      // On Android, if battery optimization is enabled, notifications may be delayed or blocked
      const batteryOptimizationStatus = await notifee.isBatteryOptimizationEnabled();
      setIsBatteryOptimized(batteryOptimizationStatus);

      // console.log('[BatteryOptimization] Status:', {
      //   isBatteryOptimized: batteryOptimizationStatus,
      //   powerManagerInfo: pmInfo,
      //   notificationSettings: settings,
      // });
    } catch (error) {
      console.error('[BatteryOptimization] Error checking status:', error);
      setIsBatteryOptimized(false);
    }
  }, []);

  /**
   * Show the battery optimization modal
   */
  const showModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  /**
   * Hide the battery optimization modal
   */
  const hideModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  /**
   * Check if modal should be shown based on dismissal history
   */
  const shouldShowModal = useCallback((): boolean => {
    const lastCheck = storage.getNumber(BATTERY_OPTIMIZATION_LAST_CHECK_KEY);
    const wasDismissed = storage.getBoolean(BATTERY_OPTIMIZATION_DISMISSED_KEY);

    if (!wasDismissed) {
      return true;
    }

    // If dismissed, only show again after 24 hours
    if (lastCheck) {
      const timeSinceLastCheck = Date.now() - lastCheck;
      return timeSinceLastCheck > CHECK_INTERVAL_MS;
    }

    return true;
  }, []);

  /**
   * Check battery optimization status and show modal if needed
   */
  const checkAndPrompt = useCallback(
    async (force = false): Promise<boolean> => {
      if (Platform.OS !== 'android') {
        return false;
      }

      await refreshStatus();

      const batteryOptimizationStatus = await notifee.isBatteryOptimizationEnabled();

      if (batteryOptimizationStatus && (force || shouldShowModal())) {
        // Update last check time
        storage.set(BATTERY_OPTIMIZATION_LAST_CHECK_KEY, Date.now());
        showModal();
        return true;
      }

      return false;
    },
    [refreshStatus, shouldShowModal, showModal],
  );

  /**
   * Open battery optimization settings
   */
  const openBatterySettings = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await notifee.openBatteryOptimizationSettings();
      // Refresh status after user returns from settings
      setTimeout(() => {
        refreshStatus();
      }, 1000);
    } catch (error) {
      console.error('[BatteryOptimization] Error opening battery settings:', error);
    }
  }, [refreshStatus]);

  /**
   * Open power manager settings (manufacturer-specific)
   */
  const openPowerManagerSettings = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await notifee.openPowerManagerSettings();
      // Refresh status after user returns from settings
      setTimeout(() => {
        refreshStatus();
      }, 1000);
    } catch (error) {
      console.error('[BatteryOptimization] Error opening power manager settings:', error);
    }
  }, [refreshStatus]);

  /**
   * Dismiss the modal for 24 hours
   */
  const remindLater = useCallback(() => {
    // Only set the timestamp, don't mark as permanently dismissed
    // This ensures it will show again after 24 hours
    storage.set(BATTERY_OPTIMIZATION_LAST_CHECK_KEY, Date.now());
    storage.set(BATTERY_OPTIMIZATION_DISMISSED_KEY, true);
    hideModal();
  }, [hideModal]);

  // Initial check on mount
  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      refreshStatus();
    }
  }, [refreshStatus]);

  const contextValue: BatteryOptimizationContextType = {
    isBatteryOptimized,
    isModalVisible,
    powerManagerInfo,
    showModal,
    hideModal,
    checkAndPrompt,
    openBatterySettings,
    openPowerManagerSettings,
    refreshStatus,
    remindLater,
  };

  return (
    <BatteryOptimizationContext.Provider value={contextValue}>
      {children}
    </BatteryOptimizationContext.Provider>
  );
};

export const useBatteryOptimization = () => {
  const context = useContext(BatteryOptimizationContext);
  if (!context) {
    throw new Error('useBatteryOptimization must be used within a BatteryOptimizationProvider');
  }
  return context;
};

export default BatteryOptimizationProvider;

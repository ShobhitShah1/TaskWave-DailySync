import notifee, { EventType } from '@notifee/react-native';
import * as Location from 'expo-location';
import * as QuickActions from 'expo-quick-actions';
import * as TaskManager from 'expo-task-manager';
import { showMessage } from 'react-native-flash-message';

import { Notification, LocationReminderStatus } from '@Types/Interface';
import { updateLocationNotificationStatus } from '@Utils/updateLocationNotificationStatus';

// Proper type for notification action events
interface NotificationActionEvent {
  actionId: string;
  notification: {
    id: string;
    data?: Record<string, unknown>;
  };
}

const LOCATION_TASK_NAME = 'background-location-task';

interface LocationReminder {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  title: string;
  message: string;
  notification: Notification;
  isActive: boolean;
  createdAt: Date;
  status: LocationReminderStatus;
}

interface LocationServiceState {
  isTracking: boolean;
  isPaused: boolean;
  activeRemindersCount: number;
  lastLocation: Location.LocationObject | null;
  serviceStatus: 'running' | 'paused' | 'stopped';
}

interface ServiceControlCallbacks {
  onServiceStart?: () => void;
  onServiceStop?: () => void;
  onServicePause?: () => void;
  onServiceResume?: () => void;
  onNotificationReceived?: (reminder: LocationReminder) => void;
}

class LocationService {
  private locationReminders: Map<string, LocationReminder> = new Map();
  private state: LocationServiceState = {
    isTracking: false,
    isPaused: false,
    activeRemindersCount: 0,
    lastLocation: null,
    serviceStatus: 'stopped',
  };
  private notificationIds: Set<string> = new Set();
  private notificationListener: any = null;
  private serviceCallbacks: ServiceControlCallbacks = {};
  private quickActionListener: any = null;

  constructor() {
    this.initializeTaskManager();
    this.setupNotificationListener();
    // this.setupQuickActions();
  }

  private async createNotificationChannels() {
    try {
      // Create notification channel for Android
      await notifee.createChannel({
        id: 'location-reminders',
        name: 'Location Reminders',
        description: 'Notifications for location-based reminders',
        importance: 4, // HIGH
        sound: 'default',
        vibration: true,
        lights: true,
      });

      // Create notification category for iOS
      await notifee.setNotificationCategories([
        {
          id: 'location-reminders',
          actions: [
            {
              id: 'stop-tracking',
              title: 'Stop Tracking',
            },
            {
              id: 'pause-tracking',
              title: 'Pause',
            },
            {
              id: 'dismiss',
              title: 'Dismiss',
            },
          ],
        },
      ]);

      console.log('Notification channels created successfully');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }

  private setupNotificationListener() {
    try {
      // Use the correct method for setting up notification action listeners
      this.notificationListener = notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.ACTION_PRESS) {
          const { actionId, notification } = detail as NotificationActionEvent;
          console.log('Notification action pressed:', actionId);

          switch (actionId) {
            case 'stop-tracking':
              this.handleStopTracking(notification);
              break;
            case 'dismiss':
              this.handleDismissNotification(notification);
              break;
            case 'pause-tracking':
              this.handlePauseTracking(notification);
              break;
            default:
              console.log('Unknown action:', actionId);
          }
        }
      });

      console.log('Notification listener setup successfully');
    } catch (error) {
      console.error('Error setting up notification listener:', error);
    }
  }

  private async handleStopTracking(notification: any) {
    try {
      const reminderId = notification.data?.reminderId;

      if (reminderId) {
        // Remove the specific reminder
        this.removeLocationReminder(reminderId);

        showMessage({
          message: 'Location tracking stopped for this reminder',
          type: 'info',
        });
      } else {
        // Stop all tracking
        await this.stopLocationTracking();
      }

      // Cancel the notification
      await notifee.cancelNotification(notification.id);
      this.notificationIds.delete(notification.id);
    } catch (error) {
      console.error('Error handling stop tracking:', error);
    }
  }

  private async handleDismissNotification(notification: any) {
    try {
      await notifee.cancelNotification(notification.id);
      this.notificationIds.delete(notification.id);

      showMessage({
        message: 'Notification dismissed',
        type: 'info',
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  private async handlePauseTracking(notification: any) {
    try {
      await this.pauseLocationTracking();

      // Cancel the notification
      await notifee.cancelNotification(notification.id);
      this.notificationIds.delete(notification.id);
    } catch (error) {
      console.error('Error handling pause tracking:', error);
    }
  }

  private initializeTaskManager() {
    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.error('Location task error:', error);
        return;
      }

      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations && locations.length > 0) {
          const currentLocation = locations[0];
          this.state.lastLocation = currentLocation;
          await this.checkLocationReminders(currentLocation);
        }
      }
    });
  }

  private async checkLocationReminders(currentLocation: Location.LocationObject) {
    if (this.state.isPaused) {
      return;
    }

    const { latitude, longitude } = currentLocation.coords;

    for (const [id, reminder] of this.locationReminders) {
      if (!reminder.isActive) continue;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        reminder.latitude,
        reminder.longitude,
      );

      if (distance <= reminder.radius) {
        await this.triggerLocationNotification(reminder);
        this.deactivateReminder(id);
      }
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private async triggerLocationNotification(reminder: LocationReminder) {
    try {
      // Ensure channels are created before showing notification
      await this.createNotificationChannels();

      const notificationId = `location_${reminder.id}_${Date.now()}`;
      this.notificationIds.add(notificationId);

      // Set status to Sent in memory
      const r = this.locationReminders.get(reminder.id);
      if (r) r.status = LocationReminderStatus.Sent;

      // Persist status to database
      await updateLocationNotificationStatus(reminder.id, LocationReminderStatus.Sent);

      const notificationConfig = {
        id: notificationId,
        title: reminder.title,
        body: reminder.message,
        android: {
          channelId: 'location-reminders',
          importance: 4, // HIGH
          sound: 'default',
          vibration: true,
          // actions: [
          //   {
          //     title: 'Stop Tracking',
          //     pressAction: {
          //       id: 'stop-tracking',
          //     },
          //   },
          //   {
          //     title: 'Pause',
          //     pressAction: {
          //       id: 'pause-tracking',
          //     },
          //   },
          //   {
          //     title: 'Dismiss',
          //     pressAction: {
          //       id: 'dismiss',
          //     },
          //   },
          // ],
        },
        ios: {
          sound: 'default',
          categoryId: 'location-reminders',
          userInfo: {
            reminderId: reminder.id,
          },
        },
        data: {
          reminderId: reminder.id,
          notificationType: 'location',
          id: reminder.id,
          type: reminder.notification.type,
          message: reminder.message,
          date:
            reminder.notification.date instanceof Date
              ? reminder.notification.date.toISOString()
              : reminder.notification.date,
          subject: reminder.notification.subject || '',
          toContact: JSON.stringify(reminder.notification.toContact || []),
          toMail: JSON.stringify(reminder.notification.toMail || []),
          attachments: JSON.stringify(reminder.notification.attachments || []),
          memo: JSON.stringify(reminder.notification.memo || []),
          scheduleFrequency: reminder.notification.scheduleFrequency || '',
          telegramUsername: reminder.notification.telegramUsername || '',
          days: JSON.stringify(reminder.notification.days || []),
          latitude: reminder.latitude,
          longitude: reminder.longitude,
          radius: reminder.radius,
          locationName: reminder.notification.locationName || '',
        },
      };

      console.log(
        'Displaying notification with config:',
        JSON.stringify(notificationConfig, null, 2),
      );

      await notifee.displayNotification(notificationConfig);

      showMessage({
        message: `Location reminder: ${reminder.title}`,
        description: reminder.message,
        type: 'success',
      });
    } catch (error) {
      console.error('Error triggering location notification:', error);
      showMessage({
        message: 'Failed to show location notification',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    }
  }

  // Stop all active notifications
  async stopAllNotifications(): Promise<void> {
    try {
      for (const notificationId of this.notificationIds) {
        await notifee.cancelNotification(notificationId);
      }

      this.notificationIds.clear();

      showMessage({
        message: 'All location notifications stopped',
        type: 'info',
      });
    } catch (error) {
      console.error('Error stopping notifications:', error);
    }
  }

  // Stop a specific notification
  async stopNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
      this.notificationIds.delete(notificationId);
    } catch (error) {
      console.error('Error stopping notification:', error);
    }
  }

  async startLocationTracking(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showMessage({
          message: 'Location permission is required for location-based reminders.',
          type: 'danger',
        });
        return false;
      }

      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        showMessage({
          message: 'Background location permission is required for location-based reminders.',
          type: 'danger',
        });
        return false;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // 10 seconds
        distanceInterval: 50, // 50 meters
        activityType: Location.ActivityType.Fitness,
        showsBackgroundLocationIndicator: true,
      });

      this.state.isTracking = true;
      this.state.serviceStatus = 'running';
      this.state.isPaused = false;

      console.log('Location tracking started successfully');

      // Notify callbacks
      this.serviceCallbacks.onServiceStart?.();

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  async stopLocationTracking(): Promise<void> {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      this.state.isTracking = false;
      this.state.isPaused = false;
      this.state.serviceStatus = 'stopped';

      // Stop all notifications when tracking stops
      await this.stopAllNotifications();

      console.log('Location tracking stopped successfully');

      // Notify callbacks
      this.serviceCallbacks.onServiceStop?.();

      showMessage({
        message: 'Location tracking stopped',
        type: 'info',
      });
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  async pauseLocationTracking(): Promise<void> {
    this.state.isPaused = true;
    this.state.serviceStatus = 'paused';

    console.log('Location tracking paused');

    // Notify callbacks
    this.serviceCallbacks.onServicePause?.();

    showMessage({
      message: 'Location tracking paused',
      type: 'info',
    });
  }

  async resumeLocationTracking(): Promise<void> {
    this.state.isPaused = false;
    this.state.serviceStatus = 'running';

    console.log('Location tracking resumed');

    // Notify callbacks
    this.serviceCallbacks.onServiceResume?.();

    showMessage({
      message: 'Location tracking resumed',
      type: 'info',
    });
  }

  addLocationReminder(reminder: Omit<LocationReminder, 'isActive' | 'createdAt' | 'status'>): void {
    const locationReminder: LocationReminder = {
      ...reminder,
      isActive: true,
      createdAt: new Date(),
      status: LocationReminderStatus.Pending,
    };

    this.locationReminders.set(reminder.id, locationReminder);
    this.state.activeRemindersCount = this.getActiveRemindersCount();

    console.log(`Location reminder added: ${reminder.title}`, {
      totalReminders: this.locationReminders.size,
      activeReminders: this.state.activeRemindersCount,
    });

    // Start tracking if not already started
    if (!this.state.isTracking) {
      this.startLocationTracking();
    }
  }

  removeLocationReminder(id: string): void {
    const reminder = this.locationReminders.get(id);
    if (reminder) {
      console.log(`Removing location reminder: ${reminder.title}`);
    }

    this.locationReminders.delete(id);
    this.state.activeRemindersCount = this.getActiveRemindersCount();

    console.log('Reminder removed', {
      totalReminders: this.locationReminders.size,
      activeReminders: this.state.activeRemindersCount,
    });

    // Stop tracking if no more reminders
    if (this.locationReminders.size === 0 && this.state.isTracking) {
      this.stopLocationTracking();
    }
  }

  deactivateReminder(id: string): void {
    const reminder = this.locationReminders.get(id);
    if (reminder) {
      reminder.isActive = false;
      // Optionally, set status to Expired if you want to mark deactivated as expired
      // reminder.status = LocationReminderStatus.Expired;
      this.state.activeRemindersCount = this.getActiveRemindersCount();
      console.log(`Deactivated reminder: ${reminder.title}`);
    }
  }

  activateReminder(id: string): void {
    const reminder = this.locationReminders.get(id);
    if (reminder) {
      reminder.isActive = true;
      this.state.activeRemindersCount = this.getActiveRemindersCount();
      console.log(`Activated reminder: ${reminder.title}`);
    }
  }

  getLocationReminders(): LocationReminder[] {
    return Array.from(this.locationReminders.values());
  }

  getActiveReminders(): LocationReminder[] {
    return Array.from(this.locationReminders.values()).filter((reminder) => reminder.isActive);
  }

  getActiveRemindersCount(): number {
    return Array.from(this.locationReminders.values()).filter((reminder) => reminder.isActive)
      .length;
  }

  getServiceState(): LocationServiceState {
    return { ...this.state };
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return null;
      }

      const result = await Location.getLastKnownPositionAsync({
        maxAge: 0,
        requiredAccuracy: Location.Accuracy.Highest,
      });

      if (result) {
        return result;
      } else {
        return await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 100,
          timeInterval: 1000,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Get the last known location from tracking
  getLastKnownLocation(): Location.LocationObject | null {
    return this.state.lastLocation;
  }

  // Clear all reminders and stop tracking
  async clearAllReminders(): Promise<void> {
    this.locationReminders.clear();
    this.state.activeRemindersCount = 0;

    if (this.state.isTracking) {
      await this.stopLocationTracking();
    }

    showMessage({
      message: 'All location reminders cleared',
      type: 'info',
    });
  }

  // Check if a specific reminder is active
  isReminderActive(id: string): boolean {
    const reminder = this.locationReminders.get(id);
    return reminder?.isActive || false;
  }

  // Get reminder by ID
  getReminderById(id: string): LocationReminder | undefined {
    return this.locationReminders.get(id);
  }

  // Cleanup method to remove notification listener
  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener();
      this.notificationListener = null;
    }
  }

  // Test method to create an interactive notification for testing
  async testInteractiveNotification(): Promise<void> {
    try {
      const testReminder: LocationReminder = {
        id: 'test-reminder',
        latitude: 0,
        longitude: 0,
        radius: 100,
        title: 'Test Location Reminder',
        message: 'This is a test notification with interactive buttons',
        notification: {
          id: 'test',
          type: 'location',
          message: 'Test message',
          date: new Date(),
          toContact: [],
          toMail: [],
          subject: '',
          attachments: [],
          scheduleFrequency: null,
          days: [],
          telegramUsername: '',
        },
        isActive: true,
        createdAt: new Date(),
        status: LocationReminderStatus.Pending,
      };

      console.log('Testing interactive notification...');
      await this.triggerLocationNotification(testReminder);

      showMessage({
        message: 'Test notification sent!',
        description: 'Check your notification panel for interactive buttons',
        type: 'success',
      });
    } catch (error) {
      console.error('Error testing interactive notification:', error);
      showMessage({
        message: 'Error testing notification',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    }
  }

  // Add a test location reminder to see data in ServiceManager
  addTestLocationReminder(): void {
    const testReminder: Omit<LocationReminder, 'isActive' | 'createdAt' | 'status'> = {
      id: `test-reminder-${Date.now()}`,
      latitude: 37.78825,
      longitude: -122.4324,
      radius: 100,
      title: 'Test Location Reminder',
      message: 'This is a test location reminder for ServiceManager',
      notification: {
        id: `test-${Date.now()}`,
        type: 'location',
        message: 'Test location reminder',
        date: new Date(),
        toContact: [],
        toMail: [],
        subject: '',
        attachments: [],
        scheduleFrequency: null,
        days: [],
        telegramUsername: '',
      },
    };

    this.addLocationReminder(testReminder);

    showMessage({
      message: 'Test location reminder added',
      description: 'Check the ServiceManager to see the new reminder',
      type: 'success',
    });
  }

  // Force test notification with minimal config
  async forceTestNotification(): Promise<void> {
    try {
      // Create a simple notification with actions
      await notifee.displayNotification({
        id: 'force-test',
        title: 'Force Test Notification',
        body: 'This should show buttons',
        android: {
          channelId: 'location-reminders',
          importance: 4,
          actions: [
            {
              title: 'Test Button',
              pressAction: {
                id: 'test-action',
              },
            },
          ],
        },
        ios: {
          categoryId: 'location-reminders',
        },
      });

      console.log('Force test notification sent');
      showMessage({
        message: 'Force test notification sent',
        type: 'info',
      });
    } catch (error) {
      console.error('Force test notification error:', error);
      showMessage({
        message: 'Force test failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    }
  }

  // Setup Expo Quick Actions for service control
  private setupQuickActions() {
    try {
      // Set up quick actions for service control
      QuickActions.setItems([
        {
          title: 'Stop Location Tracking',
          subtitle: 'Stop all location tracking',
          icon: 'location_off',
          id: 'stop-location-tracking',
          params: { action: 'stop-tracking' },
        },
        {
          title: 'Pause Location Tracking',
          subtitle: 'Pause location tracking temporarily',
          icon: 'pause',
          id: 'pause-location-tracking',
          params: { action: 'pause-tracking' },
        },
        {
          title: 'Resume Location Tracking',
          subtitle: 'Resume paused location tracking',
          icon: 'play_arrow',
          id: 'resume-location-tracking',
          params: { action: 'resume-tracking' },
        },
        {
          title: 'Location Service Status',
          subtitle: 'Check current service status',
          icon: 'info',
          id: 'location-service-status',
          params: { action: 'check-status' },
        },
      ]);

      // Listen for quick action presses
      this.quickActionListener = QuickActions.addListener((action) => {
        console.log('Quick action pressed:', action);
        this.handleQuickAction(action);
      });

      console.log('Quick actions setup successfully');
    } catch (error) {
      console.error('Error setting up quick actions:', error);
    }
  }

  private handleQuickAction(action: any) {
    switch (action.id) {
      case 'stop-location-tracking':
        this.stopLocationTracking();
        break;
      case 'pause-location-tracking':
        this.pauseLocationTracking();
        break;
      case 'resume-location-tracking':
        this.resumeLocationTracking();
        break;
      case 'location-service-status':
        this.showServiceStatus();
        break;
      default:
        console.log('Unknown quick action:', action.id);
    }
  }

  // Register callbacks for service events
  registerCallbacks(callbacks: ServiceControlCallbacks) {
    this.serviceCallbacks = { ...this.serviceCallbacks, ...callbacks };
  }

  // Unregister callbacks
  unregisterCallbacks() {
    this.serviceCallbacks = {};
  }

  // Show current service status
  private showServiceStatus() {
    const status = this.getServiceState();
    const message = `Location Service Status:
- Tracking: ${status.isTracking ? 'Active' : 'Inactive'}
- Paused: ${status.isPaused ? 'Yes' : 'No'}
- Active Reminders: ${status.activeRemindersCount}
- Service Status: ${status.serviceStatus}`;

    showMessage({
      message: 'Location Service Status',
      description: message,
      type: 'info',
      duration: 5000,
    });
  }

  // Get detailed service information
  getServiceInfo() {
    const state = this.getServiceState();
    const reminders = this.getLocationReminders();

    const info = {
      ...state,
      totalReminders: reminders.length,
      activeReminders: reminders.filter((r) => r.isActive),
      inactiveReminders: reminders.filter((r) => !r.isActive),
      lastKnownLocation: state.lastLocation,
      serviceUptime: this.calculateServiceUptime(),
      isAnyServiceRunning: this.isAnyServiceRunning(),
    };

    console.log('Service info:', info);
    return info;
  }

  private calculateServiceUptime(): number {
    // Calculate how long the service has been running
    // This is a simplified version - you might want to track actual start time
    return this.state.isTracking ? Date.now() : 0;
  }

  // Force stop all services and clear everything
  async forceStopAllServices(): Promise<void> {
    try {
      // Stop location tracking
      await this.stopLocationTracking();

      // Clear all reminders
      this.locationReminders.clear();
      this.state.activeRemindersCount = 0;

      // Cancel all notifications
      await this.stopAllNotifications();

      // Reset state
      this.state = {
        isTracking: false,
        isPaused: false,
        activeRemindersCount: 0,
        lastLocation: null,
        serviceStatus: 'stopped',
      };

      showMessage({
        message: 'All location services stopped',
        description: 'Location tracking and all reminders have been cleared',
        type: 'info',
      });

      // Notify callbacks
      this.serviceCallbacks.onServiceStop?.();
    } catch (error) {
      console.error('Error force stopping services:', error);
      showMessage({
        message: 'Error stopping services',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
    }
  }

  // Emergency stop - immediately stop everything
  async emergencyStop(): Promise<void> {
    try {
      // Immediately stop location updates
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

      // Clear everything without notifications
      this.locationReminders.clear();
      this.notificationIds.clear();
      this.state = {
        isTracking: false,
        isPaused: false,
        activeRemindersCount: 0,
        lastLocation: null,
        serviceStatus: 'stopped',
      };

      console.log('Emergency stop executed');
    } catch (error) {
      console.error('Error in emergency stop:', error);
    }
  }

  // Check if any services are running
  isAnyServiceRunning(): boolean {
    const hasReminders = this.locationReminders.size > 0;
    const isTracking = this.state.isTracking;

    console.log('Service running check:', { hasReminders, isTracking });
    return isTracking || hasReminders;
  }

  // Get running services summary
  getRunningServicesSummary(): string {
    const state = this.getServiceState();
    const reminders = this.getLocationReminders();

    let summary = 'Location Services:\n';
    summary += `- Tracking: ${state.isTracking ? 'Active' : 'Inactive'}\n`;
    summary += `- Paused: ${state.isPaused ? 'Yes' : 'No'}\n`;
    summary += `- Active Reminders: ${state.activeRemindersCount}\n`;
    summary += `- Total Reminders: ${reminders.length}\n`;

    if (reminders.length > 0) {
      summary += '\nActive Reminders:\n';
      reminders.forEach((reminder) => {
        if (reminder.isActive) {
          summary += `- ${reminder.title} (${reminder.latitude.toFixed(4)}, ${reminder.longitude.toFixed(4)})\n`;
        }
      });
    } else {
      summary += '\nNo active reminders found.\n';
    }

    console.log('Running services summary:', summary);
    return summary;
  }
}

export default new LocationService();

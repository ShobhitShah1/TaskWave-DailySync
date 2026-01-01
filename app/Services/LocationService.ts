import notifee from '@notifee/react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { showMessage } from 'react-native-flash-message';

import { Notification, LocationReminderStatus, LocationReminder } from '@Types/Interface';
import { updateLocationNotificationStatus } from '@Utils/updateLocationNotificationStatus';
import { getStoredLocationRadius, DEFAULT_LOCATION_RADIUS } from '@Contexts/SettingsProvider';

// ============================================================================
// Constants
// ============================================================================
const LOCATION_TASK_NAME = 'background-location-task';
const DEFAULT_RADIUS = DEFAULT_LOCATION_RADIUS;

// ============================================================================
// Module State
// ============================================================================
let reminders: Map<string, LocationReminder> = new Map();
let isTracking = false;
let isStarting = false;
let isRestoring = false;
let lastLocation: Location.LocationObject | null = null;
let locationSubscription: Location.LocationSubscription | null = null;

// ============================================================================
// TaskManager - Kept for potential future background use but not currently used
// ============================================================================
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[LocationService] Background task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations?.length > 0) {
      const loc = locations[0];
      console.log(
        `[LocationService] Background location update: [${loc.coords.latitude.toFixed(6)}, ${loc.coords.longitude.toFixed(6)}] accuracy=${loc.coords.accuracy?.toFixed(0)}m`,
      );
      lastLocation = loc;
      await checkProximityAndNotify(loc);
    }
  }
});

/**
 * Handle location update from watcher
 */
async function handleLocationUpdate(location: Location.LocationObject): Promise<void> {
  lastLocation = location;
  const { latitude, longitude } = location.coords;
  console.log(
    `[LocationService] Location update: [${latitude.toFixed(6)}, ${longitude.toFixed(6)}] accuracy=${location.coords.accuracy?.toFixed(0)}m`,
  );
  await checkProximityAndNotify(location);
}

// ============================================================================
// Helper Functions
// ============================================================================

function isPending(status: LocationReminderStatus | string | undefined): boolean {
  if (!status) return true; // No status = pending (for backwards compat)
  return status === LocationReminderStatus.Pending || status === 'pending';
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

async function ensureNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: 'location-reminders',
    name: 'Location Reminders',
    importance: 4,
    sound: 'default',
    vibration: true,
  });
}

async function checkProximityAndNotify(currentLocation: Location.LocationObject): Promise<void> {
  const { latitude, longitude } = currentLocation.coords;

  const activeReminders = Array.from(reminders.values()).filter((r) => r.isActive);
  if (activeReminders.length > 0) {
    console.log(
      `[LocationService] Checking proximity for ${activeReminders.length} active reminder(s) at [${latitude.toFixed(5)}, ${longitude.toFixed(5)}]`,
    );
  }

  for (const [id, reminder] of reminders) {
    if (!reminder.isActive) continue;

    const distance = calculateDistance(latitude, longitude, reminder.latitude, reminder.longitude);

    console.log(
      `[LocationService] Reminder "${reminder.title}": distance=${distance.toFixed(0)}m, radius=${reminder.radius}m, willTrigger=${distance <= reminder.radius}`,
    );

    if (distance <= reminder.radius) {
      console.log(
        `[LocationService] ✓ Inside radius! Triggering notification for: ${reminder.title}`,
      );
      await triggerNotification(reminder);
      deactivateReminder(id);
    }
  }
}

async function triggerNotification(reminder: LocationReminder): Promise<void> {
  try {
    await ensureNotificationChannel();

    // Update status in memory
    const r = reminders.get(reminder.id);
    if (r) r.status = LocationReminderStatus.Sent;

    // Persist to database
    await updateLocationNotificationStatus(reminder.id, LocationReminderStatus.Sent);

    // Display notification
    await notifee.displayNotification({
      id: `location_${reminder.id}_${Date.now()}`,
      title: reminder.title,
      body: reminder.message,
      android: {
        channelId: 'location-reminders',
        importance: 4,
        sound: 'default',
      },
      data: {
        id: reminder.id,
        type: 'location',
        notificationType: 'location',
      },
    });

    showMessage({
      message: reminder.title,
      description: reminder.message,
      type: 'success',
    });

    console.log(`[LocationService] Notification sent for: ${reminder.title}`);
  } catch (error) {
    console.error('[LocationService] Failed to trigger notification:', error);
  }
}

function deactivateReminder(id: string): void {
  const reminder = reminders.get(id);
  if (reminder) {
    reminder.isActive = false;
    console.log(`[LocationService] Deactivated: ${reminder.title}`);
  }
}

function getActiveCount(): number {
  return Array.from(reminders.values()).filter((r) => r.isActive).length;
}

/**
 * Immediately check proximity for a single reminder
 * This is called when a new reminder is added to check if user is already inside radius
 */
async function checkImmediateProximity(reminder: LocationReminder): Promise<void> {
  try {
    // Get current location
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      console.log('[LocationService] Could not get current location for immediate check');
      return;
    }

    const { latitude, longitude } = currentLocation.coords;
    const distance = calculateDistance(latitude, longitude, reminder.latitude, reminder.longitude);

    console.log(
      `[LocationService] Immediate proximity check: distance=${distance.toFixed(0)}m, radius=${reminder.radius}m`,
    );

    if (distance <= reminder.radius) {
      console.log(
        `[LocationService] User already inside radius! Triggering notification immediately.`,
      );
      await triggerNotification(reminder);
      deactivateReminder(reminder.id);
    }
  } catch (error) {
    console.error('[LocationService] Immediate proximity check failed:', error);
  }
}

// ============================================================================
// Public API
// ============================================================================
/**
 * Start location tracking if not already started
 * Tries background tracking first, falls back to foreground if unavailable
 */
export async function startTracking(): Promise<boolean> {
  if (isTracking) return true;
  if (isStarting) return false;

  try {
    isStarting = true;

    // Request foreground permission first
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      showMessage({ message: 'Location permission required', type: 'danger' });
      return false;
    }

    // Try to get background permission for when app is closed
    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();

    if (bgStatus === 'granted') {
      // Try background tracking first (works when app is closed)
      try {
        // Check if already running
        const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (!isTaskRunning) {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // 10 seconds
            distanceInterval: 30, // 30 meters
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: 'DailySync Location',
              notificationBody: 'Tracking your location for reminders',
              notificationColor: '#405DF0',
            },
          });
        }
        isTracking = true;
        console.log('[LocationService] Background location tracking started');
        return true;
      } catch (bgError) {
        console.warn('[LocationService] Background tracking failed, using foreground:', bgError);
      }
    }

    // Fallback to foreground tracking (only works when app is open)
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 20,
      },
      handleLocationUpdate,
    );

    isTracking = true;
    console.log('[LocationService] Foreground location tracking started');
    return true;
  } catch (error) {
    console.error('[LocationService] Failed to start tracking:', error);
    return false;
  } finally {
    isStarting = false;
  }
}

/**
 * Stop location tracking
 */
export async function stopTracking(): Promise<void> {
  try {
    // Stop background tracking
    try {
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (isTaskRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        console.log('[LocationService] Background tracking stopped');
      }
    } catch (e) {
      // Task may not exist
    }

    // Stop foreground tracking
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }

    isTracking = false;
    console.log('[LocationService] Tracking stopped');
  } catch (error) {
    console.error('[LocationService] Failed to stop tracking:', error);
  }
}

/**
 * Add a new location reminder (for newly created reminders)
 */
export async function addReminder(data: {
  id: string;
  latitude: number;
  longitude: number;
  radius?: number;
  title: string;
  message: string;
  notification: Notification;
}): Promise<void> {
  // Get the dynamic radius from settings if not provided
  const effectiveRadius = data.radius || getStoredLocationRadius() || DEFAULT_RADIUS;

  const reminder: LocationReminder = {
    id: data.id,
    latitude: data.latitude,
    longitude: data.longitude,
    radius: effectiveRadius,
    title: data.title,
    message: data.message,
    notification: data.notification,
    isActive: true,
    createdAt: new Date(),
    status: LocationReminderStatus.Pending,
  };

  reminders.set(data.id, reminder);
  console.log(
    `[LocationService] Added: ${data.title} (radius: ${effectiveRadius}m, ${reminders.size} total)`,
  );

  if (!isTracking && !isRestoring) {
    await startTracking();
  }

  // Immediately check if user is already inside the radius
  await checkImmediateProximity(reminder);
}

/**
 * Remove a reminder
 */
export function removeReminder(id: string): void {
  reminders.delete(id);
  console.log(`[LocationService] Removed reminder: ${id}`);

  if (reminders.size === 0 && isTracking) {
    stopTracking();
  }
}

/**
 * Restore reminders from database on app launch
 * Call startRestore() first, then restoreReminder() for each, then finishRestore()
 */
export function startRestore(): void {
  isRestoring = true;
  reminders.clear();
  console.log('[LocationService] Starting restore...');
}

export function restoreReminder(data: {
  id: string;
  latitude: number;
  longitude: number;
  radius?: number;
  title: string;
  message: string;
  status?: LocationReminderStatus | string;
  createdAt?: Date;
  notification: Notification;
}): void {
  // Skip if already exists
  if (reminders.has(data.id)) return;

  // Only restore pending reminders
  const shouldBeActive = isPending(data.status);

  // Use stored radius from data, fallback to settings, then default
  const effectiveRadius = data.radius || getStoredLocationRadius() || DEFAULT_RADIUS;

  const reminder: LocationReminder = {
    id: data.id,
    latitude: data.latitude,
    longitude: data.longitude,
    radius: effectiveRadius,
    title: data.title,
    message: data.message,
    notification: data.notification,
    isActive: shouldBeActive,
    createdAt: data.createdAt || new Date(),
    status: (data.status as LocationReminderStatus) || LocationReminderStatus.Pending,
  };

  reminders.set(data.id, reminder);
  console.log(
    `[LocationService] Restored: ${data.title} [active=${shouldBeActive}, radius=${effectiveRadius}m]`,
  );
}

export async function finishRestore(): Promise<void> {
  isRestoring = false;
  const activeCount = getActiveCount();
  console.log(`[LocationService] Restore complete. Active: ${activeCount}`);

  if (activeCount > 0 && !isTracking) {
    await startTracking();
  }

  // Check proximity for all restored active reminders
  await checkAllActiveRemindersProximity();
}

/**
 * Check proximity for all active reminders
 * Called after restore to catch any reminders that user is already inside
 */
async function checkAllActiveRemindersProximity(): Promise<void> {
  try {
    const currentLocation = await getCurrentLocation();
    if (!currentLocation) {
      console.log('[LocationService] Could not get current location for bulk proximity check');
      return;
    }

    console.log('[LocationService] Checking proximity for all active reminders...');
    await checkProximityAndNotify(currentLocation);
  } catch (error) {
    console.error('[LocationService] Bulk proximity check failed:', error);
  }
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const cached = await Location.getLastKnownPositionAsync({ maxAge: 60000 });
    if (cached) return cached;

    return await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  } catch (error) {
    console.error('[LocationService] Failed to get location:', error);
    return null;
  }
}

/**
 * Get all reminders
 */
export function getReminders(): LocationReminder[] {
  return Array.from(reminders.values());
}

/**
 * Get active reminders count
 */
export function getActiveRemindersCount(): number {
  return getActiveCount();
}

/**
 * Check if tracking is active
 */
export function isServiceTracking(): boolean {
  return isTracking;
}

/**
 * Get last known location from tracking
 */
export function getLastLocation(): Location.LocationObject | null {
  return lastLocation;
}

/**
 * Get service state (for ServiceManager compatibility)
 */
export function getServiceState() {
  return {
    isTracking,
    isPaused: false, // Simplified - no pause state in new implementation
    activeRemindersCount: getActiveCount(),
    lastLocation,
    serviceStatus: isTracking ? 'running' : 'stopped',
  };
}

/**
 * Get extended service info (for ServiceManager compatibility)
 */
export function getServiceInfo() {
  const allReminders = Array.from(reminders.values());
  return {
    isTracking,
    isPaused: false,
    activeRemindersCount: getActiveCount(),
    totalReminders: allReminders.length,
    activeReminders: allReminders.filter((r) => r.isActive),
    inactiveReminders: allReminders.filter((r) => !r.isActive),
    lastLocation,
    serviceStatus: isTracking ? 'running' : 'stopped',
    isAnyServiceRunning: isTracking || allReminders.length > 0,
  };
}

/**
 * Activate a reminder by ID
 */
export function activateReminder(id: string): void {
  const reminder = reminders.get(id);
  if (reminder) {
    reminder.isActive = true;
    reminder.status = LocationReminderStatus.Pending;
    console.log(`[LocationService] Activated: ${reminder.title}`);
  }
}

/**
 * Check if any service is running
 */
export function isAnyServiceRunning(): boolean {
  return isTracking || reminders.size > 0;
}

/**
 * Get running services summary text
 */
export function getRunningServicesSummary(): string {
  return `Tracking: ${isTracking ? 'Active' : 'Inactive'}\nReminders: ${reminders.size} total, ${getActiveCount()} active`;
}

/**
 * Force stop all services (for ServiceManager compatibility)
 */
export async function forceStopAllServices(): Promise<void> {
  await stopTracking();
  reminders.clear();
  showMessage({ message: 'All services stopped', type: 'info' });
}

/**
 * Emergency stop (for ServiceManager compatibility)
 */
export async function emergencyStop(): Promise<void> {
  try {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch (e) {
    // Ignore errors
  }
  isTracking = false;
  reminders.clear();
  console.log('[LocationService] Emergency stop executed');
}

/**
 * Test notification (for ServiceManager compatibility)
 */
export async function testInteractiveNotification(): Promise<void> {
  await ensureNotificationChannel();
  await notifee.displayNotification({
    id: `test_${Date.now()}`,
    title: 'Test Location Reminder',
    body: 'This is a test notification',
    android: {
      channelId: 'location-reminders',
      importance: 4,
    },
  });
  showMessage({ message: 'Test notification sent', type: 'success' });
}

/**
 * Add test location reminder (for ServiceManager compatibility)
 */
export function addTestLocationReminder(): void {
  addReminder({
    id: `test_${Date.now()}`,
    latitude: 0,
    longitude: 0,
    radius: DEFAULT_RADIUS,
    title: 'Test Location Reminder',
    message: 'This is a test reminder',
    notification: {
      id: `test_${Date.now()}`,
      type: 'location',
      message: 'Test reminder',
      date: new Date(),
      toContact: [],
      toMail: [],
      subject: 'Test',
      attachments: [],
      scheduleFrequency: null,
      days: [],
      telegramUsername: '',
    },
  });
  showMessage({ message: 'Test reminder added', type: 'success' });
}

// Pause/Resume stubs (simplified - just log)
export async function pauseLocationTracking(): Promise<void> {
  console.log('[LocationService] Pause not implemented in simplified version');
  showMessage({ message: 'Pause not available', type: 'warning' });
}

export async function resumeLocationTracking(): Promise<void> {
  console.log('[LocationService] Resume not implemented in simplified version');
  showMessage({ message: 'Resume not available', type: 'warning' });
}

// Default export for backwards compatibility
const LocationService = {
  // Core functions
  startTracking,
  stopTracking,
  addReminder,
  removeReminder,
  startRestore,
  restoreReminder,
  finishRestore,
  getCurrentLocation,
  getReminders,
  getActiveRemindersCount,
  isServiceTracking,
  getLastLocation,

  // ServiceManager compatibility
  getServiceState,
  getServiceInfo,
  activateReminder,
  isAnyServiceRunning,
  getRunningServicesSummary,
  forceStopAllServices,
  emergencyStop,
  testInteractiveNotification,
  addTestLocationReminder,
  pauseLocationTracking,
  resumeLocationTracking,

  // Aliases for backwards compatibility
  startLocationTracking: startTracking,
  stopLocationTracking: stopTracking,
  addLocationReminder: addReminder,
  removeLocationReminder: removeReminder,
  startRestoringReminders: startRestore,
  restoreLocationReminder: restoreReminder,
  finishRestoringReminders: finishRestore,
};

export default LocationService;

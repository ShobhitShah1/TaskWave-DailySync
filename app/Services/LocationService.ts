import notifee from '@notifee/react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { showMessage } from 'react-native-flash-message';

import { Notification, LocationReminderStatus, LocationReminder } from '@Types/Interface';
import { updateLocationNotificationStatus } from '@Utils/updateLocationNotificationStatus';

// ============================================================================
// Constants
// ============================================================================
const LOCATION_TASK_NAME = 'background-location-task';
const DEFAULT_RADIUS = 100;

// ============================================================================
// Module State
// ============================================================================
let reminders: Map<string, LocationReminder> = new Map();
let isTracking = false;
let isStarting = false;
let isRestoring = false;
let lastLocation: Location.LocationObject | null = null;

// ============================================================================
// Task Manager Setup (must be at module level for background execution)
// ============================================================================
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[LocationService] Task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations?.length > 0) {
      lastLocation = locations[0];
      await checkProximityAndNotify(locations[0]);
    }
  }
});

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

  for (const [id, reminder] of reminders) {
    if (!reminder.isActive) continue;

    const distance = calculateDistance(latitude, longitude, reminder.latitude, reminder.longitude);

    if (distance <= reminder.radius) {
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

// ============================================================================
// Public API
// ============================================================================

/**
 * Start location tracking if not already started
 */
export async function startTracking(): Promise<boolean> {
  if (isTracking) return true;
  if (isStarting) return false;

  try {
    isStarting = true;

    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      showMessage({ message: 'Location permission required', type: 'danger' });
      return false;
    }

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
      showMessage({ message: 'Background location permission required', type: 'danger' });
      return false;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,
      distanceInterval: 50,
      showsBackgroundLocationIndicator: true,
    });

    isTracking = true;
    console.log('[LocationService] Tracking started');
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
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    isTracking = false;
    console.log('[LocationService] Tracking stopped');
  } catch (error) {
    console.error('[LocationService] Failed to stop tracking:', error);
  }
}

/**
 * Add a new location reminder (for newly created reminders)
 */
export function addReminder(data: {
  id: string;
  latitude: number;
  longitude: number;
  radius?: number;
  title: string;
  message: string;
  notification: Notification;
}): void {
  const reminder: LocationReminder = {
    id: data.id,
    latitude: data.latitude,
    longitude: data.longitude,
    radius: data.radius || DEFAULT_RADIUS,
    title: data.title,
    message: data.message,
    notification: data.notification,
    isActive: true,
    createdAt: new Date(),
    status: LocationReminderStatus.Pending,
  };

  reminders.set(data.id, reminder);
  console.log(`[LocationService] Added: ${data.title} (${reminders.size} total)`);

  if (!isTracking && !isRestoring) {
    startTracking();
  }
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

  const reminder: LocationReminder = {
    id: data.id,
    latitude: data.latitude,
    longitude: data.longitude,
    radius: data.radius || DEFAULT_RADIUS,
    title: data.title,
    message: data.message,
    notification: data.notification,
    isActive: shouldBeActive,
    createdAt: data.createdAt || new Date(),
    status: (data.status as LocationReminderStatus) || LocationReminderStatus.Pending,
  };

  reminders.set(data.id, reminder);
  console.log(`[LocationService] Restored: ${data.title} [active=${shouldBeActive}]`);
}

export function finishRestore(): void {
  isRestoring = false;
  const activeCount = getActiveCount();
  console.log(`[LocationService] Restore complete. Active: ${activeCount}`);

  if (activeCount > 0 && !isTracking) {
    startTracking();
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

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { FONTS } from '../Constants/Theme';
import { useAppContext } from '../Contexts/ThemeProvider';
import useThemeColors from '../Hooks/useThemeMode';
import LocationService from '../Services/LocationService';

const { width, height } = Dimensions.get('window');

interface ServiceManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ isVisible, onClose }) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const [serviceInfo, setServiceInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'reminders' | 'advanced'>('overview');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(height));
  const statusDotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('ServiceManager: isVisible changed to', isVisible);
    if (isVisible) {
      updateServiceInfo();
      setDebugInfo('ServiceManager opened');
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  useEffect(() => {
    if (serviceInfo?.serviceStatus === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(statusDotAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(statusDotAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      statusDotAnim.setValue(1);
    }
  }, [serviceInfo?.serviceStatus]);

  const updateServiceInfo = () => {
    try {
      const info = LocationService.getServiceInfo();
      console.log('ServiceManager: Service info updated', info);
      setServiceInfo(info);
      setDebugInfo(`Service info updated: ${JSON.stringify(info, null, 2)}`);
    } catch (error) {
      console.error('ServiceManager: Error updating service info', error);
      setDebugInfo(`Error updating service info: ${error}`);
    }
  };

  const handleServiceAction = async (action: string) => {
    console.log('ServiceManager: Handling action', action);
    setIsLoading(true);
    setDebugInfo(`Executing action: ${action}`);

    try {
      switch (action) {
        case 'start':
          await LocationService.startLocationTracking();
          showMessage({
            message: 'Location tracking started',
            type: 'success',
          });
          break;
        case 'stop':
          await LocationService.stopLocationTracking();
          showMessage({
            message: 'Location tracking stopped',
            type: 'info',
          });
          break;
        case 'pause':
          await LocationService.pauseLocationTracking();
          showMessage({
            message: 'Location tracking paused',
            type: 'warning',
          });
          break;
        case 'resume':
          await LocationService.resumeLocationTracking();
          showMessage({
            message: 'Location tracking resumed',
            type: 'success',
          });
          break;
        case 'forceStop':
          Alert.alert(
            'Force Stop All Services',
            'This will stop all location tracking and clear all reminders. Are you sure?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Stop All',
                style: 'destructive',
                onPress: async () => {
                  await LocationService.forceStopAllServices();
                  updateServiceInfo();
                },
              },
            ],
          );
          break;
        case 'emergency':
          Alert.alert(
            'Emergency Stop',
            'This will immediately stop all services without any notifications. Are you sure?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Emergency Stop',
                style: 'destructive',
                onPress: async () => {
                  await LocationService.emergencyStop();
                  updateServiceInfo();
                },
              },
            ],
          );
          break;
        case 'test':
          await LocationService.testInteractiveNotification();
          showMessage({
            message: 'Test notification sent',
            type: 'info',
          });
          break;
        case 'addTest':
          await LocationService.addTestLocationReminder();
          showMessage({
            message: 'Test reminder added',
            type: 'success',
          });
          break;
        default:
          break;
      }
      updateServiceInfo();
    } catch (error) {
      console.error('ServiceManager: Service action error', error);
      showMessage({
        message: 'Error performing action',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'danger',
      });
      setDebugInfo(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return 'play-circle';
      case 'paused':
        return 'pause-circle';
      case 'stopped':
        return 'stop-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusGradient = (status: string, colors: any): [string, string] => {
    switch (status) {
      case 'running':
        return [colors.green, colors.lightBlue];
      case 'paused':
        return [colors.yellow, colors.grayBackground];
      case 'stopped':
        return [colors.reminderCardBackground, colors.grayBackground];
      default:
        return [colors.primary, colors.primary];
    }
  };

  const getStatusDotColor = (status: string, colors: any) => {
    switch (status) {
      case 'running':
        return colors.green;
      case 'paused':
        return colors.yellow;
      case 'stopped':
      default:
        return colors.gmailText;
    }
  };

  const renderTabButton = (
    tab: 'overview' | 'reminders' | 'advanced',
    title: string,
    icon: string,
  ) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.tabButton,
        selectedTab === tab && {
          backgroundColor: colors.primary,
          borderRadius: 24,
          paddingHorizontal: 20,
          paddingVertical: 10,
          shadowColor: colors.primary,
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 6,
          borderWidth: 0,
        },
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={selectedTab === tab ? colors.white : colors.grayTitle}
      />
      <Text
        style={[
          styles.tabButtonText,
          {
            color: selectedTab === tab ? colors.white : colors.grayTitle,
            fontWeight: selectedTab === tab ? 'bold' : 'normal',
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Debug Info */}
      {__DEV__ && (
        <View style={[styles.debugSection, { backgroundColor: colors.grayBackground }]}>
          <View style={styles.debugHeader}>
            <Ionicons name="bug" size={16} color={colors.yellow} />
            <Text style={[styles.debugTitle, { color: colors.text }]}>Debug Info</Text>
          </View>
          <Text style={[styles.debugText, { color: colors.grayTitle }]}>{debugInfo}</Text>
        </View>
      )}

      {/* Service Status Card */}
      <LinearGradient
        colors={getStatusGradient(serviceInfo?.serviceStatus || 'stopped', colors)}
        style={[
          styles.statusCard,
          serviceInfo?.serviceStatus === 'running' && styles.statusCardGlow,
          {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.borderColor,
            shadowColor: 'rgba(0,0,0,0.10)',
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 6,
            marginBottom: 20,
            borderRadius: 20,
          },
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusCardContent}>
          <View
            style={[
              styles.statusIconContainer,
              { backgroundColor: colors.grayBackground, borderRadius: 16 },
            ]}
          >
            {' '}
            {/* theme-aware */}
            <Ionicons
              name={getStatusIcon(serviceInfo?.serviceStatus || 'stopped')}
              size={48}
              color={colors.primary}
            />
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {' '}
              {serviceInfo?.serviceStatus?.toUpperCase() || 'STOPPED'}{' '}
            </Text>
            <Text style={[styles.statusSubtext, { color: colors.grayTitle }]}>
              {' '}
              Location Tracking Service{' '}
            </Text>
          </View>
          <View style={styles.statusIndicator}>
            <Animated.View
              style={[
                styles.statusDot,
                {
                  backgroundColor: getStatusDotColor(serviceInfo?.serviceStatus, colors),
                  transform: [
                    { scale: serviceInfo?.serviceStatus === 'running' ? statusDotAnim : 1 },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Service Stats Grid */}
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.borderColor,
              shadowColor: 'rgba(0,0,0,0.10)',
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
              marginBottom: 16,
              borderRadius: 16,
            },
          ]}
        >
          <View style={styles.statIconContainer}>
            <Ionicons name="location" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {' '}
            {serviceInfo?.isTracking ? 'Active' : 'Inactive'}{' '}
          </Text>
          <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Tracking</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.borderColor,
              shadowColor: 'rgba(0,0,0,0.10)',
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
              marginBottom: 16,
              borderRadius: 16,
            },
          ]}
        >
          <View style={styles.statIconContainer}>
            <Ionicons name="pause" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {serviceInfo?.isPaused ? 'Yes' : 'No'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Paused</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.borderColor,
              shadowColor: 'rgba(0,0,0,0.10)',
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
              marginBottom: 16,
              borderRadius: 16,
            },
          ]}
        >
          <View style={styles.statIconContainer}>
            <Ionicons name="notifications" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {serviceInfo?.activeRemindersCount || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Active</Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.borderColor,
              shadowColor: 'rgba(0,0,0,0.10)',
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
              marginBottom: 16,
              borderRadius: 16,
            },
          ]}
        >
          <View style={styles.statIconContainer}>
            <Ionicons name="list" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {serviceInfo?.totalReminders || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Total</Text>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Controls</Text>
        <View style={styles.controlGrid}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: colors.green },
              (isLoading || serviceInfo?.isTracking) && styles.disabledButton,
            ]}
            onPress={() => handleServiceAction('start')}
            disabled={isLoading || serviceInfo?.isTracking}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="play" size={24} color="white" />
            )}
            <Text style={styles.controlButtonText}>Start</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: colors.gmailText },
              (isLoading || !serviceInfo?.isTracking) && styles.disabledButton,
            ]}
            onPress={() => handleServiceAction('stop')}
            disabled={isLoading || !serviceInfo?.isTracking}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="stop" size={24} color="white" />
            )}
            <Text style={styles.controlButtonText}>Stop</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: colors.yellow },
              (isLoading || !serviceInfo?.isTracking || serviceInfo?.isPaused) &&
                styles.disabledButton,
            ]}
            onPress={() => handleServiceAction('pause')}
            disabled={isLoading || !serviceInfo?.isTracking || serviceInfo?.isPaused}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="pause" size={24} color="white" />
            )}
            <Text style={styles.controlButtonText}>Pause</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: colors.blue },
              (isLoading || !serviceInfo?.isPaused) && styles.disabledButton,
            ]}
            onPress={() => handleServiceAction('resume')}
            disabled={isLoading || !serviceInfo?.isPaused}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="play" size={24} color="white" />
            )}
            <Text style={styles.controlButtonText}>Resume</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderRemindersTab = () => (
    <View style={styles.tabContent}>
      {/* Active Reminders */}
      {serviceInfo?.activeReminders && serviceInfo.activeReminders.length > 0 && (
        <View style={styles.remindersSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Active Location Reminders ({serviceInfo.activeReminders.length})
            </Text>
          </View>
          {serviceInfo.activeReminders.map((reminder: any) => (
            <View
              key={reminder.id}
              style={[styles.reminderCard, { backgroundColor: colors.grayBackground }]}
            >
              <View style={styles.reminderCardHeader}>
                <View style={styles.reminderInfo}>
                  <Text style={[styles.reminderTitle, { color: colors.text }]}>
                    {reminder.title}
                  </Text>
                  <Text style={[styles.reminderMessage, { color: colors.grayTitle }]}>
                    {reminder.message}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.green }]}>
                  <Text style={styles.statusBadgeText}>Active</Text>
                </View>
              </View>
              <View style={styles.reminderDetails}>
                <View style={styles.reminderDetail}>
                  <Ionicons name="location" size={16} color={colors.grayTitle} />
                  <Text style={[styles.reminderDetailText, { color: colors.grayTitle }]}>
                    {reminder.latitude.toFixed(4)}, {reminder.longitude.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.reminderDetail}>
                  <Ionicons name="radio" size={16} color={colors.grayTitle} />
                  <Text style={[styles.reminderDetailText, { color: colors.grayTitle }]}>
                    Radius: {reminder.radius}m
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.gmailText }]}
                onPress={() => {
                  LocationService.removeLocationReminder(reminder.id);
                  updateServiceInfo();
                  showMessage({
                    message: 'Reminder removed',
                    type: 'info',
                  });
                }}
              >
                <Ionicons name="trash" size={16} color="white" />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Inactive Reminders */}
      {serviceInfo?.inactiveReminders && serviceInfo.inactiveReminders.length > 0 && (
        <View style={styles.remindersSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={20} color={colors.grayTitle} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Inactive Location Reminders ({serviceInfo.inactiveReminders.length})
            </Text>
          </View>
          {serviceInfo.inactiveReminders.map((reminder: any) => (
            <View
              key={reminder.id}
              style={[styles.reminderCard, { backgroundColor: colors.grayBackground }]}
            >
              <View style={styles.reminderCardHeader}>
                <View style={styles.reminderInfo}>
                  <Text style={[styles.reminderTitle, { color: colors.text }]}>
                    {reminder.title}
                  </Text>
                  <Text style={[styles.reminderMessage, { color: colors.grayTitle }]}>
                    {reminder.message}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.grayTitle }]}>
                  <Text style={styles.statusBadgeText}>Inactive</Text>
                </View>
              </View>
              <View style={styles.reminderDetails}>
                <View style={styles.reminderDetail}>
                  <Ionicons name="location" size={16} color={colors.grayTitle} />
                  <Text style={[styles.reminderDetailText, { color: colors.grayTitle }]}>
                    {reminder.latitude.toFixed(4)}, {reminder.longitude.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.reminderDetail}>
                  <Ionicons name="radio" size={16} color={colors.grayTitle} />
                  <Text style={[styles.reminderDetailText, { color: colors.grayTitle }]}>
                    Radius: {reminder.radius}m
                  </Text>
                </View>
              </View>
              <View style={styles.reminderActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.green }]}
                  onPress={() => {
                    LocationService.activateReminder(reminder.id);
                    updateServiceInfo();
                    showMessage({
                      message: 'Reminder activated',
                      type: 'success',
                    });
                  }}
                >
                  <Ionicons name="play" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Activate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.gmailText }]}
                  onPress={() => {
                    LocationService.removeLocationReminder(reminder.id);
                    updateServiceInfo();
                    showMessage({
                      message: 'Reminder removed',
                      type: 'info',
                    });
                  }}
                >
                  <Ionicons name="trash" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {(!serviceInfo?.activeReminders || serviceInfo.activeReminders.length === 0) &&
        (!serviceInfo?.inactiveReminders || serviceInfo.inactiveReminders.length === 0) && (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons name="location-outline" size={64} color={colors.grayTitle} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No Location Reminders
            </Text>
            <Text style={[styles.emptyStateMessage, { color: colors.grayTitle }]}>
              Add location reminders to get notified when you reach specific locations
            </Text>
            <TouchableOpacity
              style={[styles.addReminderButton, { backgroundColor: colors.primary }]}
              onPress={() => handleServiceAction('addTest')}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addReminderButtonText}>Add Test Reminder</Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );

  const renderAdvancedTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.advancedSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Advanced Controls</Text>

        <TouchableOpacity
          style={[styles.advancedButton, { backgroundColor: colors.blue }]}
          onPress={() => handleServiceAction('test')}
          disabled={isLoading}
        >
          <Ionicons name="notifications" size={24} color="white" />
          <Text style={styles.advancedButtonText}>Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.advancedButton, { backgroundColor: colors.gmailText }]}
          onPress={() => handleServiceAction('forceStop')}
          disabled={isLoading}
        >
          <Ionicons name="trash" size={24} color="white" />
          <Text style={styles.advancedButtonText}>Force Stop All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.advancedButton, { backgroundColor: colors.gmailDark }]}
          onPress={() => handleServiceAction('emergency')}
          disabled={isLoading}
        >
          <Ionicons name="warning" size={24} color="white" />
          <Text style={styles.advancedButtonText}>Emergency Stop</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.advancedButton, { backgroundColor: colors.green }]}
          onPress={() => handleServiceAction('addTest')}
          disabled={isLoading}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.advancedButtonText}>Add Test Reminder</Text>
        </TouchableOpacity>
      </View>

      {/* Service Summary */}
      {serviceInfo?.isAnyServiceRunning && (
        <View style={[styles.summarySection, { backgroundColor: colors.grayBackground }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Running Services</Text>
          </View>
          <Text style={[styles.summaryText, { color: colors.grayTitle }]}>
            {LocationService.getRunningServicesSummary()}
          </Text>
        </View>
      )}
    </View>
  );

  console.log('ServiceManager: Rendering with isVisible:', isVisible, 'serviceInfo:', serviceInfo);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: theme === 'dark' ? 'rgba(30,31,31,0.7)' : 'rgba(0,0,0,0.18)',
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.background,
              borderRadius: 28,
              shadowColor: 'rgba(0,0,0,0.18)',
              shadowOpacity: 0.18,
              shadowRadius: 32,
              elevation: 12,
              borderColor: colors.borderColor,
              borderWidth: 1,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[colors.primary, colors.primary + 'CC']}
            style={[
              styles.header,
              {
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                elevation: 4,
                shadowColor: 'rgba(0,0,0,0.12)',
                shadowOpacity: 0.12,
                shadowRadius: 12,
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconContainer, { backgroundColor: colors.primary }]}>
                {' '}
                {/* theme-aware */}
                <Ionicons name="settings" size={24} color={colors.white} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.white }]}>Service Manager</Text>
                <Text style={[styles.subtitle, { color: colors.white08 }]}>
                  Location Tracking Control Center
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Tab Navigation */}
          <View
            style={[
              styles.tabNavigation,
              {
                backgroundColor: colors.grayBackground,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderColor,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                elevation: 2,
                shadowColor: 'rgba(0,0,0,0.08)',
                shadowOpacity: 0.08,
                shadowRadius: 8,
              },
            ]}
          >
            {renderTabButton('overview', 'Overview', 'grid')}
            {renderTabButton('reminders', 'Reminders', 'location')}
            {renderTabButton('advanced', 'Advanced', 'settings')}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {selectedTab === 'overview' && renderOverviewTab()}
            {selectedTab === 'reminders' && renderRemindersTab()}
            {selectedTab === 'advanced' && renderAdvancedTab()}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: width * 0.97,
    maxHeight: height * 0.9,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 12,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    // backgroundColor: '#000', // replaced with theme-aware
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
    // color: '#000', // replaced with theme-aware
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    // color: '#000', // replaced with theme-aware
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: '#000', // replaced with theme-aware
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    // backgroundColor: '#000', // replaced with theme-aware
    // Use a slightly darker gray for light mode
    // Will be overridden inline below
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    // color: '#000', // replaced with theme-aware
    // Will be overridden inline below
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 20,
  },
  debugSection: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    // borderColor: '#000', // replaced with theme-aware
    // backgroundColor: '#000', // replaced with theme-aware
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  debugTitle: {
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
    // color: '#000', // replaced with theme-aware
  },
  debugText: {
    fontSize: 12,
    fontFamily: FONTS.Regular,
    // color: '#000', // replaced with theme-aware
  },
  statusCard: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
  },
  statusCardGlow: {
    // shadowColor: '#000', // replaced with theme-aware
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },
  statusCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    // backgroundColor: '#000', // replaced with theme-aware
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
    // color: '#000', // replaced with theme-aware
  },
  statusSubtext: {
    fontSize: 16,
    fontFamily: FONTS.Regular,
    // color: '#000', // replaced with theme-aware
    marginTop: 4,
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    // backgroundColor: '#000', // replaced with theme-aware
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    marginBottom: 4,
    // color: '#000', // replaced with theme-aware
  },
  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    // color: '#000', // replaced with theme-aware
  },
  controlSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
    // color: '#000', // replaced with theme-aware
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  controlButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    borderRadius: 18,
    gap: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
  remindersSection: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  reminderCard: {
    padding: 24,
    borderRadius: 20,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  reminderCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
    marginBottom: 4,
    // color: '#000', // replaced with theme-aware
  },
  reminderMessage: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    // color: '#000', // replaced with theme-aware
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
  reminderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reminderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderDetailText: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    // color: '#000', // replaced with theme-aware
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  reminderActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 56,
    paddingHorizontal: 12,
  },
  emptyStateIcon: {
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 26,
    fontFamily: FONTS.Bold,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  emptyStateMessage: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
    opacity: 0.8,
  },
  addReminderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 20,
    gap: 12,
    elevation: 8,
    // Use theme color in component, fallback here
    shadowColor: '#000', // replaced with theme-aware in component
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  addReminderButtonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: FONTS.Bold,
    letterSpacing: 0.1,
  },
  advancedSection: {
    gap: 16,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    borderRadius: 18,
    gap: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
  },
  advancedButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
  summarySection: {
    padding: 20,
    borderRadius: 16,
  },
  summaryText: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    lineHeight: 20,
    // color: '#000', // replaced with theme-aware
  },
});

export default ServiceManager;

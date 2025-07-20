import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import Modal from 'react-native-modal';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { FONTS } from '../Constants/Theme';
import { useAppContext } from '../Contexts/ThemeProvider';
import useThemeColors from '../Hooks/useThemeMode';
import LocationService from '../Services/LocationService';
import ControlGrid from './ServiceManager/ControlGrid';
import RemindersList from './ServiceManager/RemindersList';
import StatusCard from './ServiceManager/StatusCard';
import TabNavigation from './ServiceManager/TabNavigation';

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

  const dotScale = useSharedValue(1);

  // Button animation scales
  type ButtonKey =
    | 'start'
    | 'stop'
    | 'pause'
    | 'resume'
    | 'test'
    | 'forceStop'
    | 'emergency'
    | 'addTest';
  const buttonScales: Record<ButtonKey, ReturnType<typeof useSharedValue<number>>> = {
    start: useSharedValue<number>(1),
    stop: useSharedValue<number>(1),
    pause: useSharedValue<number>(1),
    resume: useSharedValue<number>(1),
    test: useSharedValue<number>(1),
    forceStop: useSharedValue<number>(1),
    emergency: useSharedValue<number>(1),
    addTest: useSharedValue<number>(1),
  };

  // Status dot pulse
  useEffect(() => {
    if (serviceInfo?.serviceStatus === 'running') {
      dotScale.value = withRepeat(
        withSequence(withTiming(1.3, { duration: 600 }), withTiming(1, { duration: 600 })),
        -1,
        false,
      );
    } else {
      dotScale.value = withTiming(1, { duration: 200 });
    }
  }, [serviceInfo?.serviceStatus]);

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    backgroundColor: theme === 'dark' ? 'rgba(30,31,31,0.7)' : 'rgba(0,0,0,0.18)',
  }));

  // Button press handlers
  const handleButtonPressIn = (key: string) => {
    if (buttonScales[key as ButtonKey])
      buttonScales[key as ButtonKey].value = withSpring(0.95, { damping: 10 });
  };
  const handleButtonPressOut = (key: string) => {
    if (buttonScales[key as ButtonKey])
      buttonScales[key as ButtonKey].value = withSpring(1, { damping: 10 });
  };

  // Service info update
  const updateServiceInfo = () => {
    try {
      const info = LocationService.getServiceInfo();
      setServiceInfo(info);
      setDebugInfo(`Service info updated: ${JSON.stringify(info, null, 2)}`);
    } catch (error) {
      setDebugInfo(`Error updating service info: ${error}`);
    }
  };

  // Service action handler
  const handleServiceAction = async (action: string) => {
    setIsLoading(true);
    setDebugInfo(`Executing action: ${action}`);
    try {
      switch (action) {
        case 'start':
          await LocationService.startLocationTracking();
          showMessage({ message: 'Location tracking started', type: 'success' });
          break;
        case 'stop':
          await LocationService.stopLocationTracking();
          showMessage({ message: 'Location tracking stopped', type: 'info' });
          break;
        case 'pause':
          await LocationService.pauseLocationTracking();
          showMessage({ message: 'Location tracking paused', type: 'warning' });
          break;
        case 'resume':
          await LocationService.resumeLocationTracking();
          showMessage({ message: 'Location tracking resumed', type: 'success' });
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
          showMessage({ message: 'Test notification sent', type: 'info' });
          break;
        case 'addTest':
          await LocationService.addTestLocationReminder();
          showMessage({ message: 'Test reminder added', type: 'success' });
          break;
        default:
          break;
      }
      updateServiceInfo();
    } catch (error) {
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

  // Utility to strip instagramGradient from colors for StatusCard
  const stripGradient = (colors: Record<string, any>) => {
    const { instagramGradient, ...rest } = colors;
    return rest;
  };

  return (
    <Modal
      isVisible={isVisible}
      style={{ margin: 0 }}
      onBackButtonPress={onClose}
      statusBarTranslucent
      animationIn="slideInUp"
      animationOut="slideOutDown"
      deviceHeight={Dimensions.get('screen').height}
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Animated.View style={[styles.container, { backgroundColor: colors.background }]}>
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
                <Ionicons name="settings" size={24} color={colors.white} />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.white }]}>Service Manager</Text>
                <Text style={[styles.subtitle, { color: colors.grayTitle }]}>
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
          <TabNavigation selectedTab={selectedTab} onSelectTab={setSelectedTab} colors={colors} />

          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {selectedTab === 'overview' && (
              <View style={styles.tabContent}>
                <StatusCard
                  status={serviceInfo?.serviceStatus || 'stopped'}
                  colors={stripGradient(colors)}
                  dotScale={dotScale}
                  debugInfo={debugInfo}
                  showDebug={__DEV__}
                />
                {/* Modern Dashboard Summary Card for Stats - solid background, white icons */}
                <View style={[styles.statsSummaryCard, { backgroundColor: colors.primary }]}>
                  <View style={styles.statsRow}>
                    <View
                      style={[
                        styles.statsIconCircle,
                        {
                          backgroundColor: serviceInfo?.isTracking
                            ? colors.green
                            : colors.gmailText,
                        },
                      ]}
                    >
                      <Ionicons
                        name={serviceInfo?.isTracking ? 'play-circle' : 'close-circle'}
                        size={26}
                        color={colors.white}
                      />
                    </View>
                    <Text style={[styles.statsLabel, { color: colors.white }]}>Tracking</Text>
                    <Text style={[styles.statsValue, { color: colors.white }]}>
                      {serviceInfo?.isTracking ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  {/* Paused */}
                  <View style={styles.statsRow}>
                    <View
                      style={[
                        styles.statsIconCircle,
                        {
                          backgroundColor: serviceInfo?.isPaused ? colors.yellow : colors.grayTitle,
                        },
                      ]}
                    >
                      <Ionicons
                        name={serviceInfo?.isPaused ? 'pause-circle' : 'play-forward'}
                        size={26}
                        color={colors.white}
                      />
                    </View>
                    <Text style={[styles.statsLabel, { color: colors.white }]}>Paused</Text>
                    <Text style={[styles.statsValue, { color: colors.white }]}>
                      {serviceInfo?.isPaused ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  {/* Active Reminders */}
                  <View style={styles.statsRow}>
                    <View style={[styles.statsIconCircle, { backgroundColor: colors.blue }]}>
                      <Ionicons name="notifications" size={26} color={colors.white} />
                    </View>
                    <Text style={[styles.statsLabel, { color: colors.white }]}>Active</Text>
                    <Text style={[styles.statsValue, { color: colors.white }]}>
                      {serviceInfo?.activeRemindersCount || 0}
                    </Text>
                  </View>
                  {/* Total Reminders */}
                  <View style={styles.statsRow}>
                    <View style={[styles.statsIconCircle, { backgroundColor: colors.darkBlue }]}>
                      <Ionicons name="list-circle" size={26} color={colors.white} />
                    </View>
                    <Text style={[styles.statsLabel, { color: colors.white }]}>Total</Text>
                    <Text style={[styles.statsValue, { color: colors.white }]}>
                      {serviceInfo?.totalReminders || 0}
                    </Text>
                  </View>
                </View>

                {/* Control Buttons */}
                <View style={styles.controlSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Controls</Text>
                  <ControlGrid
                    isLoading={isLoading}
                    isTracking={!!serviceInfo?.isTracking}
                    isPaused={!!serviceInfo?.isPaused}
                    colors={colors}
                    onStart={() => handleServiceAction('start')}
                    onStop={() => handleServiceAction('stop')}
                    onPause={() => handleServiceAction('pause')}
                    onResume={() => handleServiceAction('resume')}
                    onPressIn={handleButtonPressIn}
                    onPressOut={handleButtonPressOut}
                  />
                </View>
              </View>
            )}
            {selectedTab === 'reminders' && (
              <RemindersList
                activeReminders={serviceInfo?.activeReminders || []}
                inactiveReminders={serviceInfo?.inactiveReminders || []}
                colors={colors}
                onActivate={(id) => {
                  LocationService.activateReminder(id);
                  updateServiceInfo();
                  showMessage({ message: 'Reminder activated', type: 'success' });
                }}
                onRemove={(id) => {
                  LocationService.removeLocationReminder(id);
                  updateServiceInfo();
                  showMessage({ message: 'Reminder removed', type: 'info' });
                }}
              />
            )}
            {selectedTab === 'advanced' && (
              <View>
                {/* Advanced Controls Card - vertical feature list, no buttons */}
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 22,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.1,
                    shadowRadius: 16,
                    elevation: 6,
                    marginBottom: 10,
                    padding: 0,
                    overflow: 'hidden',
                  }}
                >
                  <View style={{ paddingHorizontal: 22, gap: 5 }}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 20 }]}>
                      Advanced Controls
                    </Text>
                    <Text
                      style={[styles.sectionLabel, { color: colors.grayTitle, marginBottom: 10 }]}
                    >
                      Power features for advanced users
                    </Text>
                    {/* Feature Rows - no buttons, just details */}
                    <View style={{ gap: 18 }}>
                      {/* Test Notification */}
                      <Pressable
                        onPress={() => handleServiceAction('test')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
                      >
                        <View style={[styles.headerIconCircle, { backgroundColor: colors.blue }]}>
                          <Ionicons name="notifications" size={22} color={colors.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.advancedRowLabel, { color: colors.text }]}>
                            Test Notification
                          </Text>
                          <Text style={[styles.advancedRowDesc, { color: colors.grayTitle }]}>
                            Send a test notification to verify setup
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.grayTitle} />
                      </Pressable>
                      {/* Add Test Reminder */}
                      <Pressable
                        onPress={() => handleServiceAction('addTest')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
                      >
                        <View style={[styles.headerIconCircle, { backgroundColor: colors.green }]}>
                          <Ionicons name="add-circle" size={22} color={colors.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.advancedRowLabel, { color: colors.text }]}>
                            Add Test Reminder
                          </Text>
                          <Text style={[styles.advancedRowDesc, { color: colors.grayTitle }]}>
                            Add a sample location-based reminder
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.grayTitle} />
                      </Pressable>
                    </View>
                    {/* Divider */}
                    <View
                      style={{ height: 1, backgroundColor: colors.borderColor, marginVertical: 8 }}
                    />
                    {/* Danger Zone - details only */}
                    <View style={{ gap: 18, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Ionicons
                          name="warning"
                          size={20}
                          color={colors.gmailText}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={[styles.sectionTitle, { color: colors.gmailText, fontSize: 16 }]}
                        >
                          Danger Zone
                        </Text>
                      </View>
                      {/* Force Stop All */}
                      <Pressable
                        onPress={() => handleServiceAction('forceStop')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
                      >
                        <View
                          style={[styles.headerIconCircle, { backgroundColor: colors.gmailText }]}
                        >
                          <Ionicons name="trash" size={22} color={colors.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.advancedRowLabel, { color: colors.text }]}>
                            Force Stop All
                          </Text>
                          <Text style={[styles.advancedRowDesc, { color: colors.grayTitle }]}>
                            Stop all services and clear reminders
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.grayTitle} />
                      </Pressable>
                      {/* Emergency Stop */}
                      <Pressable
                        onPress={() => handleServiceAction('emergency')}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}
                      >
                        <View
                          style={[styles.headerIconCircle, { backgroundColor: colors.gmailDark }]}
                        >
                          <Ionicons name="warning" size={22} color={colors.white} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.advancedRowLabel, { color: colors.text }]}>
                            Emergency Stop
                          </Text>
                          <Text style={[styles.advancedRowDesc, { color: colors.grayTitle }]}>
                            Immediately stop all services
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.grayTitle} />
                      </Pressable>
                    </View>
                  </View>
                </View>
                {/* Service Summary Chip/Card */}
                {serviceInfo?.isAnyServiceRunning && (
                  <View
                    style={{
                      backgroundColor: colors.background,
                      borderRadius: 18,
                      padding: 14,
                      shadowColor: colors.blue,
                      shadowOpacity: 0.18,
                      shadowRadius: 18,
                      elevation: 8,
                      borderLeftWidth: 6,
                      borderLeftColor: colors.blue,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      alignSelf: 'flex-start',
                      marginLeft: 8,
                      marginTop: 20,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={[
                        styles.summaryText,
                        { color: colors.grayTitle, fontSize: 14, flex: 1 },
                      ]}
                    >
                      {LocationService.getRunningServicesSummary()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Animated.ScrollView>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
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
  },
  debugText: {
    fontSize: 12,
    fontFamily: FONTS.Regular,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
  },
  statusSubtext: {
    fontSize: 16,
    fontFamily: FONTS.Regular,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
  },
  controlSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
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
  },
  reminderMessage: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgeText: {
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
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  addReminderButtonText: {
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
  },
  statsGridModern: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 18,
    marginBottom: 18,
  },
  statCardModern: {
    width: '47%',
    aspectRatio: 1.1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statAccentDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 2,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconModern: {
    marginBottom: 10,
    marginTop: 8,
  },
  statValueModern: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabelModern: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.8,
  },
  statsGridModernSolid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 18,
  },
  statCardModernSolid: {
    width: '48%',
    aspectRatio: 1.1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingVertical: 18,
    paddingHorizontal: 8,
  },
  statIconModernSolid: {
    marginBottom: 12,
    marginTop: 2,
  },
  statValueModernSolid: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabelModernSolid: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.95,
  },
  statsSummaryCard: {
    borderRadius: 24,
    padding: 12, // reduced from 20
    marginBottom: 12, // reduced from 22
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8, // reduced from 16
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  statsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statsLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 54,
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
  },
  advancedRowLabel: {
    fontSize: 15,
    fontWeight: '700',
    flexWrap: 'wrap',
  },
  advancedRowDesc: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.8,
    marginTop: 2,
  },
  advancedRowAction: {
    minWidth: 54,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    paddingHorizontal: 14,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ServiceManager;

import { Ionicons } from '@expo/vector-icons';
import React, { FC, memo, useCallback } from 'react';
import { Dimensions, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import ReactNativeModal from 'react-native-modal';
import Animated, { Easing, FadeIn, FadeInUp } from 'react-native-reanimated';

import { FONTS } from '@Constants/Theme';
import { useBatteryOptimization } from '@Contexts/BatteryOptimizationProvider';
import useThemeColors from '@Hooks/useThemeMode';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface BatteryOptimizationModalProps {
  /** Override visibility (optional - defaults to context state) */
  visible?: boolean;
  /** Override close handler (optional - defaults to context state) */
  onClose?: () => void;
  /** Called when user opens settings */
  onOpenSettings?: () => void;
}

const BatteryOptimizationModal: FC<BatteryOptimizationModalProps> = ({
  visible,
  onClose,
  onOpenSettings,
}) => {
  const colors = useThemeColors();
  const {
    isModalVisible,
    hideModal,
    openBatterySettings,
    openPowerManagerSettings,
    powerManagerInfo,
    remindLater,
  } = useBatteryOptimization();

  const isVisible = visible !== undefined ? visible : isModalVisible;
  const handleClose = onClose || hideModal;

  const handleOpenBatterySettings = useCallback(async () => {
    await openBatterySettings();
    onOpenSettings?.();
    handleClose();
  }, [openBatterySettings, onOpenSettings, handleClose]);

  const handleOpenPowerManagerSettings = useCallback(async () => {
    await openPowerManagerSettings();
    onOpenSettings?.();
    handleClose();
  }, [openPowerManagerSettings, onOpenSettings, handleClose]);

  const handleDismiss = useCallback(() => {
    remindLater();
  }, [remindLater]);

  if (Platform.OS !== 'android') {
    return null;
  }

  const manufacturerName = powerManagerInfo?.manufacturer || 'your device';
  const hasPowerManagerActivity = !!powerManagerInfo?.activity;
  const capitalizedManufacturer =
    manufacturerName.charAt(0).toUpperCase() + manufacturerName.slice(1);

  return (
    <ReactNativeModal
      isVisible={isVisible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={250}
      statusBarTranslucent
      deviceHeight={Dimensions.get('screen').height}
      useNativeDriver={true}
      onBackButtonPress={handleClose}
      style={styles.modalContainer}
      backdropOpacity={0}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.background}
        />
        {/* Header */}
        <Animated.View
          entering={FadeIn.delay(200).duration(400).easing(Easing.out(Easing.quad))}
          style={styles.header}
        >
          <Pressable
            onPress={handleClose}
            style={[styles.closeButton, { backgroundColor: colors.scheduleReminderCardBackground }]}
            android_ripple={{ color: colors.grayTitle, borderless: true }}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <Animated.View
            entering={FadeInUp.delay(300)
              .duration(500)
              .easing(Easing.out(Easing.back(1.5)))}
            style={[styles.iconContainer, { backgroundColor: 'rgba(255, 179, 64, 0.15)' }]}
          >
            <Ionicons name="battery-half-outline" size={48} color="#FFB340" />
          </Animated.View>

          {/* Title & Description */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(500).easing(Easing.out(Easing.quad))}
            style={styles.textContainer}
          >
            <Text style={[styles.title, { color: colors.text }]}>Enable Unrestricted Mode</Text>
            <Text style={[styles.description, { color: colors.grayTitle }]}>
              Your device's battery optimization may delay or block notifications. To ensure
              reminders arrive on time, please set DailySync to "Unrestricted" or "Don't optimize".
            </Text>
          </Animated.View>

          {/* Steps Card */}
          <Animated.View
            entering={FadeInUp.delay(500).duration(500).easing(Easing.out(Easing.quad))}
            style={[styles.stepsCard, { backgroundColor: colors.scheduleReminderCardBackground }]}
          >
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.darkBlue }]}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Tap <Text style={styles.stepHighlight}>"Open Settings"</Text> below
              </Text>
            </View>

            <View style={[styles.stepDivider, { backgroundColor: colors.borderColor }]} />

            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.darkBlue }]}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Find <Text style={styles.stepHighlight}>"DailySync"</Text> in the list
              </Text>
            </View>

            <View style={[styles.stepDivider, { backgroundColor: colors.borderColor }]} />

            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.darkBlue }]}>
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Select <Text style={styles.stepHighlight}>"Unrestricted"</Text> or{' '}
                <Text style={styles.stepHighlight}>"Don't optimize"</Text>
              </Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.actionsContainer}>
          <Pressable
            onPress={handleOpenBatterySettings}
            style={[styles.primaryButton, { backgroundColor: colors.darkBlue }]}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Open Settings</Text>
          </Pressable>

          {hasPowerManagerActivity && (
            <Pressable
              onPress={handleOpenPowerManagerSettings}
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: colors.scheduleReminderCardBackground,
                  borderColor: colors.borderColor,
                },
              ]}
              android_ripple={{ color: colors.grayTitle }}
            >
              <Ionicons name="phone-portrait-outline" size={18} color={colors.text} />
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                {capitalizedManufacturer} Power Settings
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleDismiss}
            style={styles.skipButton}
            android_ripple={{ color: colors.grayTitle, borderless: false }}
          >
            <Text style={[styles.skipButtonText, { color: colors.grayTitle }]}>
              Remind me after 24 hours
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </ReactNativeModal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 0,
    padding: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: FONTS.SemiBold,
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontFamily: FONTS.Regular,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  stepsCard: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepBadgeText: {
    fontFamily: FONTS.SemiBold,
    fontSize: 14,
    color: '#fff',
  },
  stepText: {
    fontFamily: FONTS.Regular,
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  stepHighlight: {
    fontFamily: FONTS.Medium,
  },
  stepDivider: {
    height: 1,
    marginLeft: 44,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  primaryButtonText: {
    fontFamily: FONTS.SemiBold,
    fontSize: 17,
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  secondaryButtonText: {
    fontFamily: FONTS.Medium,
    fontSize: 15,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  skipButtonText: {
    fontFamily: FONTS.Regular,
    fontSize: 15,
  },
});

export default memo(BatteryOptimizationModal);

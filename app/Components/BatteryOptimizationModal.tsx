import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Dimensions, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Modal from 'react-native-modal';

import { FONTS } from '../Constants/Theme';
import { useAppContext } from '../Contexts/ThemeProvider';
import useThemeColors from '../Hooks/useThemeMode';

interface BatteryOptimizationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BatteryOptimizationModal = ({
  visible,
  onConfirm,
  onCancel,
}: BatteryOptimizationModalProps) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const isDark = theme === 'dark';

  const handleConfirmPress = () => {
    onConfirm();
  };

  const handleCancelPress = () => {
    onCancel();
  };

  return (
    <Modal
      isVisible={visible}
      style={{ margin: 0 }}
      backdropOpacity={1}
      backdropColor="rgba(0,0,0,0.7)"
      hasBackdrop={true}
      statusBarTranslucent
      animationIn="slideInUp"
      animationOut="slideOutDown"
      useNativeDriver
      deviceHeight={screenHeight + (StatusBar.currentHeight || 15)}
      useNativeDriverForBackdrop
      onBackdropPress={onCancel}
      hideModalContentWhileAnimating
    >
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor: isDark ? 'rgba(63, 65, 69, 1)' : 'rgba(255, 255, 255, 1)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
            shadowColor: isDark ? colors.instagram : colors.darkBlue,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark ? 'rgba(225, 48, 108, 0.2)' : 'rgba(64, 93, 240, 0.15)',
              borderColor: isDark ? 'rgba(225, 48, 108, 0.4)' : 'rgba(64, 93, 240, 0.3)',
              shadowColor: isDark ? colors.instagram : colors.darkBlue,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            },
          ]}
        >
          <View style={{}}>
            <Ionicons
              name="battery-charging"
              size={42}
              color={isDark ? colors.instagram : colors.darkBlue}
            />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text, fontFamily: FONTS.Bold }]}>
          Battery Optimization Detected
        </Text>

        <Text
          style={[
            styles.message,
            {
              color: isDark ? colors.grayTitle : 'rgba(0,0,0,0.75)',
              fontFamily: FONTS.Medium,
            },
          ]}
        >
          To ensure you receive all notifications on time, please disable battery optimization for
          this app. This will allow the app to run reliably in the background.
        </Text>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Pressable
              style={[
                styles.button,
                styles.cancelButton,
                {
                  borderColor: isDark ? colors.instagram : colors.darkBlue,
                  backgroundColor: isDark ? 'rgba(225, 48, 108, 0.1)' : 'rgba(64, 93, 240, 0.08)',
                },
              ]}
              onPress={handleCancelPress}
            >
              <Text
                style={[
                  styles.cancelText,
                  {
                    color: isDark ? colors.instagram : colors.darkBlue,
                    fontFamily: FONTS.SemiBold,
                  },
                ]}
              >
                Skip
              </Text>
            </Pressable>
          </View>

          <View style={styles.buttonWrapper}>
            <Pressable
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: isDark ? colors.instagram : colors.darkBlue,
                  shadowColor: isDark ? colors.instagram : colors.darkBlue,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  elevation: 12,
                },
              ]}
              onPress={handleConfirmPress}
            >
              <Text style={[styles.confirmText, { color: colors.white, fontFamily: FONTS.Bold }]}>
                Continue
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 0,
    paddingBottom: 40,
  },

  backgroundPattern: {
    position: 'absolute',
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    borderRadius: screenWidth * 0.4,
    top: '20%',
    left: '60%',
  },
  glowContainer: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 50,
    elevation: 30,
  },
  glowEffect: {
    flex: 1,
    borderRadius: 200,
    opacity: 0.4,
  },
  secondaryGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  pulseRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    top: 15,
    left: '50%',
    marginLeft: -60,
  },
  modalContainer: {
    width: 360,
    maxWidth: 360,
    alignSelf: 'center',
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 20,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 25,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    borderWidth: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16.5,
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 24,
    letterSpacing: 0.2,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 14,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 18,
  },
  cancelButton: {
    borderWidth: 2,
  },
  confirmButton: {},
  cancelText: {
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  confirmText: {
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});

export default BatteryOptimizationModal;

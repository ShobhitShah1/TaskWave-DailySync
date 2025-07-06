import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { Dimensions, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import Modal from 'react-native-modal';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

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

  const glowAnimation = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const floatingParticles = useSharedValue(0);
  const backgroundWave = useSharedValue(0);
  const confirmButtonScale = useSharedValue(1);
  const cancelButtonScale = useSharedValue(1);
  const titleShimmer = useSharedValue(0);
  const pulseRing = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      glowAnimation.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );

      iconRotate.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 800 }),
          withTiming(-5, { duration: 800 }),
          withTiming(0, { duration: 400 }),
        ),
        -1,
        false,
      );

      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 1000, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true,
      );

      floatingParticles.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );

      backgroundWave.value = withRepeat(
        withTiming(1, { duration: 6000, easing: Easing.linear }),
        -1,
        false,
      );

      titleShimmer.value = withDelay(500, withRepeat(withTiming(1, { duration: 2000 }), -1, true));

      pulseRing.value = withRepeat(
        withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 500 })),
        -1,
        false,
      );
    } else {
      glowAnimation.value = 0;
      iconRotate.value = 0;
      iconScale.value = 1;
      floatingParticles.value = 0;
      backgroundWave.value = 0;
      titleShimmer.value = 0;
      pulseRing.value = 0;
    }
  }, [visible]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }, { rotate: `${iconRotate.value}deg` }],
  }));

  const animatedConfirmStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmButtonScale.value }],
  }));

  const animatedCancelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelButtonScale.value }],
  }));

  const handleConfirmPress = () => {
    confirmButtonScale.value = withSequence(
      withSpring(0.9, { damping: 22, stiffness: 260 }),
      withSpring(1.08, { damping: 22, stiffness: 260 }),
      withSpring(1, { damping: 22, stiffness: 260 }),
    );
    setTimeout(onConfirm, 220);
  };

  const handleCancelPress = () => {
    cancelButtonScale.value = withSequence(
      withSpring(0.9, { damping: 22, stiffness: 260 }),
      withSpring(1, { damping: 22, stiffness: 260 }),
    );
    setTimeout(onCancel, 170);
  };

  return (
    <Modal
      isVisible={visible}
      style={{ margin: 0 }}
      animationInTiming={700}
      animationOutTiming={400}
      backdropOpacity={1}
      backdropColor="rgba(0,0,0,0.5)"
      backdropTransitionOutTiming={400}
      backdropTransitionInTiming={700}
      hasBackdrop={true}
      statusBarTranslucent
      animationIn="slideInDown"
      animationOut="slideOutUp"
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
        <Animated.View
          entering={FadeIn.delay(400).duration(800)}
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
          <Animated.View style={animatedIconStyle}>
            <Ionicons
              name="battery-charging"
              size={42}
              color={isDark ? colors.instagram : colors.darkBlue}
            />
          </Animated.View>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(500)}
          style={[styles.title, { color: colors.text, fontFamily: FONTS.Bold }]}
        >
          Battery Optimization Detected
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(600)}
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
        </Animated.Text>

        <Animated.View entering={FadeIn.delay(700)} style={styles.buttonContainer}>
          <Animated.View style={[styles.buttonWrapper, animatedCancelStyle]}>
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
          </Animated.View>

          <Animated.View style={[styles.buttonWrapper, animatedConfirmStyle]}>
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
          </Animated.View>
        </Animated.View>
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

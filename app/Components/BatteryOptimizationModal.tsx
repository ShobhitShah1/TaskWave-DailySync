import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { FONTS } from "../Constants/Theme";
import { useAppContext } from "../Contexts/ThemeProvider";
import useThemeColors from "../Hooks/useThemeMode";

interface BatteryOptimizationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const { width: screenWidth } = Dimensions.get("window");

const BatteryOptimizationModal = ({
  visible,
  onConfirm,
  onCancel,
}: BatteryOptimizationModalProps) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const isDark = theme === "dark";

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
        true
      );

      iconRotate.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 800 }),
          withTiming(-5, { duration: 800 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      );

      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 1000, easing: Easing.in(Easing.quad) })
        ),
        -1,
        true
      );

      floatingParticles.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      backgroundWave.value = withRepeat(
        withTiming(1, { duration: 6000, easing: Easing.linear }),
        -1,
        false
      );

      titleShimmer.value = withDelay(
        500,
        withRepeat(withTiming(1, { duration: 2000 }), -1, true)
      );

      pulseRing.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        false
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

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnimation.value, [0, 1], [0.1, 0.8]),
    transform: [
      { scale: interpolate(glowAnimation.value, [0, 1], [0.8, 1.3]) },
      { rotate: `${interpolate(backgroundWave.value, [0, 1], [0, 360])}deg` },
    ],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const animatedFloatingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(floatingParticles.value, [0, 1], [0, -20]),
      },
      {
        translateX: interpolate(
          floatingParticles.value,
          [0, 0.5, 1],
          [0, 5, -5]
        ),
      },
    ],
    opacity: interpolate(floatingParticles.value, [0, 0.5, 1], [0.6, 1, 0.6]),
  }));

  const animatedConfirmStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmButtonScale.value }],
  }));

  const animatedCancelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelButtonScale.value }],
  }));

  const handleConfirmPress = () => {
    confirmButtonScale.value = withSequence(
      withSpring(0.9, { damping: 20, stiffness: 300 }),
      withSpring(1.05, { damping: 20, stiffness: 300 }),
      withSpring(1, { damping: 20, stiffness: 300 })
    );
    setTimeout(onConfirm, 200);
  };

  const handleCancelPress = () => {
    cancelButtonScale.value = withSequence(
      withSpring(0.9, { damping: 20, stiffness: 300 }),
      withSpring(1, { damping: 20, stiffness: 300 })
    );
    setTimeout(onCancel, 150);
  };

  const FloatingParticle = ({
    delay = 0,
    size = 4,
    color = colors.instagram,
  }) => (
    <Animated.View
      entering={FadeIn.delay(delay + 800)}
      style={[
        animatedFloatingStyle,
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    />
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={[
            styles.backdrop,
            {
              backgroundColor: isDark ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.75)",
            },
          ]}
        />

        <FloatingParticle delay={0} size={6} color={colors.instagram} />
        <FloatingParticle delay={200} size={4} color={colors.yellow} />
        <FloatingParticle delay={400} size={5} color={colors.blue} />
        <FloatingParticle delay={600} size={3} color={colors.green} />

        <Animated.View
          entering={SlideInUp.delay(150)
            .springify()
            .damping(25)
            .stiffness(400)
            .mass(1)}
          exiting={FadeOut.duration(250)}
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark
                ? "rgba(63, 65, 69, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.15)"
                : "rgba(0, 0, 0, 0.08)",
              shadowColor: isDark ? colors.instagram : colors.darkBlue,
            },
          ]}
        >
          <Animated.View
            entering={FadeIn.delay(400).duration(800)}
            style={[
              styles.iconContainer,
              {
                backgroundColor: isDark
                  ? "rgba(225, 48, 108, 0.2)"
                  : "rgba(64, 93, 240, 0.15)",
                borderColor: isDark
                  ? "rgba(225, 48, 108, 0.4)"
                  : "rgba(64, 93, 240, 0.3)",
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
            style={[
              styles.title,
              { color: colors.text, fontFamily: FONTS.Bold },
            ]}
          >
            ⚡ Power Mode Locked
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(600)}
            style={[
              styles.message,
              {
                color: isDark ? colors.grayTitle : "rgba(0,0,0,0.75)",
                fontFamily: FONTS.Medium,
              },
            ]}
          >
            bestie, your phone is gatekeeping us rn 💀{"\n"}
            let's fix this so we can serve you the hottest notifications! ✨🔥
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(700)}
            style={styles.buttonContainer}
          >
            <Animated.View style={[styles.buttonWrapper, animatedCancelStyle]}>
              <Pressable
                style={[
                  styles.button,
                  styles.cancelButton,
                  {
                    borderColor: isDark ? colors.instagram : colors.darkBlue,
                    backgroundColor: isDark
                      ? "rgba(225, 48, 108, 0.1)"
                      : "rgba(64, 93, 240, 0.08)",
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
                  skip
                </Text>
              </Pressable>
            </Animated.View>

            <Animated.View style={[styles.buttonWrapper, animatedConfirmStyle]}>
              <Pressable
                style={[
                  styles.button,
                  styles.confirmButton,
                  {
                    backgroundColor: isDark
                      ? colors.instagram
                      : colors.darkBlue,
                    shadowColor: isDark ? colors.instagram : colors.darkBlue,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 12,
                  },
                ]}
                onPress={handleConfirmPress}
              >
                <Text
                  style={[
                    styles.confirmText,
                    { color: colors.white, fontFamily: FONTS.Bold },
                  ]}
                >
                  🚀 let's goooo
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight || 0,
    paddingBottom: 40,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundPattern: {
    position: "absolute",
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    borderRadius: screenWidth * 0.4,
    top: "20%",
    left: "60%",
  },
  glowContainer: {
    position: "absolute",
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
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  pulseRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    top: 15,
    left: "50%",
    marginLeft: -60,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 20,
    alignItems: "center",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 25,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  iconContainer: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    borderWidth: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 18,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16.5,
    textAlign: "center",
    marginBottom: 36,
    lineHeight: 24,
    letterSpacing: 0.2,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 14,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 18,
  },
  cancelButton: {
    borderWidth: 2,
  },
  confirmButton: {},
  cancelText: {
    fontSize: 15.5,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  confirmText: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
});

export default BatteryOptimizationModal;

import Handle from '@Components/BottomSheetHandle';
import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import useThemeColors from '@Hooks/useThemeMode';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface DoNotDeleteProps {
  isVisible: boolean;
  onClose: () => void;
}

const DoNotDelete: React.FC<DoNotDeleteProps> = ({ isVisible, onClose }) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['85%', '100%'], []);

  // Animation values
  const headerScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const iconRotate = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const sparkleScale = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const particleAnimation = useSharedValue(0);

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkleScale.value }],
    opacity: interpolate(sparkleScale.value, [0, 0.5, 1], [0, 1, 0.8], Extrapolation.CLAMP),
  }));

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(particleAnimation.value, [0, 1], [0, -100], Extrapolation.CLAMP),
      },
      {
        rotate: `${particleAnimation.value * 180}deg`,
      },
    ],
    opacity: interpolate(
      particleAnimation.value,
      [0, 0.3, 0.7, 1],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const platforms = [
    {
      name: 'WhatsApp',
      icon: <Image source={AssetsPath.ic_whatsapp} style={{ width: '100%', height: '100%' }} />,
      color: colors.whatsapp,
      bgColor: colors.whatsappBackground,
    },
    {
      name: 'Telegram',
      icon: <Image source={AssetsPath.ic_telegram} style={{ width: '100%', height: '100%' }} />,
      color: colors.telegram,
      bgColor: colors.telegramBackground,
    },
    {
      name: 'SMS',
      icon: <Image source={AssetsPath.ic_sms} style={{ width: '100%', height: '100%' }} />,
      color: colors.sms,
      bgColor: colors.smsBackground,
    },
    {
      name: 'Email',
      icon: <Image source={AssetsPath.ic_gmail} style={{ width: '100%', height: '100%' }} />,
      color: colors.gmailText,
      bgColor: colors.gmailBackground,
    },
    {
      name: 'Calls',
      icon: <Image source={AssetsPath.ic_phone} style={{ width: '100%', height: '100%' }} />,
      color: colors.sms,
      bgColor: colors.smsBackground,
    },
    {
      name: 'Location',
      icon: <Image source={AssetsPath.ic_location} style={{ width: '100%', height: '100%' }} />,

      color: colors.locationText,
      bgColor: colors.locationBackground,
    },
  ];

  const brandBenefits: { icon: string; title: string; description: string; gradient: string[] }[] =
    [
      {
        icon: '🎯',
        title: 'Never Miss Important Moments',
        description: 'Stay ahead of deadlines and appointments',
        gradient: ['rgba(0, 151, 236, 1)', 'rgba(29, 155, 240, 1)'], // SMS to Telegram - cool blues
      },
      {
        icon: '⚡',
        title: 'Boost Your Productivity',
        description: 'Organized reminders = organized life',
        gradient: ['rgba(34, 200, 66, 1)', 'rgba(5, 159, 154, 1)'], // WhatsApp to WhatsApp Business - fresh greens
      },
      {
        icon: '🤝',
        title: 'Build Professional Trust',
        description: 'Punctuality creates lasting impressions',
        gradient: ['rgba(243, 145, 88, 1)', 'rgba(225, 48, 108, 1)'], // Note to Instagram - warm to cool
      },
    ];

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();

      // Staggered animations
      headerScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 100 }));
      contentOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
      iconRotate.value = withDelay(600, withSpring(360, { damping: 12 }));
      sparkleScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 120 }));
      glowIntensity.value = withDelay(600, withTiming(1, { duration: 800 }));

      // Continuous pulse
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 1500 }), withTiming(1, { duration: 1500 })),
        -1,
        true,
      );

      // Particle effects
      particleAnimation.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);
    } else {
      bottomSheetRef.current?.close();
      // Reset animations
      headerScale.value = 0;
      sparkleScale.value = 0;
      glowIntensity.value = 0;

      contentOpacity.value = 0;
      iconRotate.value = 0;
    }
  }, [isVisible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }, { scale: pulseScale.value }],
  }));

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={isVisible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enableContentPanningGesture
      enableHandlePanningGesture
      enableOverDrag
      enablePanDownToClose
      handleComponent={Handle}
      handleStyle={{ backgroundColor: colors.background, borderBottomWidth: 0 }}
      backdropComponent={() => <BlurView style={{ flex: 1 }} />}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
      }}
    >
      <BottomSheetScrollView style={styles.container}>
        <Animated.View style={[styles.particleContainer, particleStyle]}>
          <Text style={styles.particle}>✨</Text>
          <Text style={[styles.particle, { left: width * 0.3 }]}>💫</Text>
          <Text style={[styles.particle, { left: width * 0.7 }]}>⭐</Text>
        </Animated.View>

        <Animated.View style={[styles.header, headerStyle]}>
          {/* Main Icon with Sparkles */}
          <View style={styles.iconSection}>
            <Animated.View style={[styles.sparkleContainer, sparkleStyle]}>
              <Text style={styles.sparkle}>✨</Text>
              <Text style={[styles.sparkle, styles.sparkle2]}>💫</Text>
              <Text style={[styles.sparkle, styles.sparkle3]}>⭐</Text>
              <Text style={[styles.sparkle, styles.sparkle4]}>🔥</Text>
            </Animated.View>

            <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
              <LinearGradient
                colors={
                  theme === 'dark'
                    ? ['#667eea', '#764ba2', '#f093fb']
                    : ['#ffecd2', '#fcb69f', '#667eea']
                }
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.mainIcon}>⏰</Text>
                <View style={styles.iconGlow} />
              </LinearGradient>
            </Animated.View>
          </View>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                textShadowColor:
                  theme === 'dark' ? 'rgba(102, 126, 234, 0.5)' : 'rgba(0, 0, 0, 0.1)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              },
            ]}
          >
            DailySync Guardian ✨
          </Text>
          <Text style={[styles.subtitle, { color: colors.grayTitle }]}>
            Your personal vibe curator that never sleeps 🌙
          </Text>
        </Animated.View>

        {/* <Animated.View style={[styles.header, headerStyle]}>
          <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
            <LinearGradient
              colors={[colors.blue, colors.darkBlue]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.mainIcon}>⏰</Text>
            </LinearGradient>
          </Animated.View>

          <Text style={[styles.title, { color: colors.text }]}>DailySync Guardian</Text>
          <Text style={[styles.subtitle, { color: colors.grayTitle }]}>
            Your personal reminder system that never sleeps
          </Text>
        </Animated.View> */}

        <Animated.View style={contentStyle}>
          {/* Key Benefits */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Why This Matters</Text>

            {brandBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <LinearGradient
                  colors={benefit.gradient as any}
                  style={styles.benefitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.benefitIconContainer}>
                    <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                  </View>
                  <View style={styles.benefitTextContainer}>
                    <Text style={styles.benefitTitle}>{benefit.title}</Text>
                    <Text style={styles.benefitDescription}>{benefit.description}</Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Communication Channels */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Connected Channels</Text>

            <View style={styles.platformsContainer}>
              {platforms.map((platform, index) => (
                <View
                  key={index}
                  style={[
                    styles.platformCard,
                    { backgroundColor: colors.scheduleReminderCardBackground },
                  ]}
                >
                  <View style={[styles.platformIconBg, { backgroundColor: platform.bgColor }]}>
                    <Text style={styles.platformIcon}>{platform.icon}</Text>
                  </View>
                  <Text style={[styles.platformName, { color: colors.text }]}>{platform.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Protection Stats */}
          <View style={[styles.statsCard, { backgroundColor: colors.contactBackground }]}>
            <LinearGradient
              colors={
                theme === 'dark'
                  ? ['rgba(48, 169, 255, 0.1)', 'rgba(64, 93, 240, 0.1)']
                  : ['rgba(48, 169, 255, 0.05)', 'rgba(64, 93, 240, 0.05)']
              }
              style={styles.statsGradient}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.blue }]}>24/7</Text>
                  <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Active</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.borderColor }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.green }]}>100%</Text>
                  <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Reliable</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.borderColor }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.darkBlue }]}>∞</Text>
                  <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Protected</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={onClose} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.blue, colors.darkBlue]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Keep Protected</Text>
                <Text style={styles.buttonIcon}>🛡️</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                { backgroundColor: colors.scheduleReminderCardBackground },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                Got it, thanks!
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Message */}
          <View style={[styles.footerCard, { backgroundColor: colors.whatsappBackground }]}>
            <Text style={[styles.footerText, { color: colors.text }]}>
              💡 This reminder helps you maintain punctuality across all your communication
              channels, building trust and reliability in your personal and professional
              relationships.
            </Text>
          </View>
        </Animated.View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  particleContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    fontSize: 16,
    opacity: 0.6,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  mainIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.Medium,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontFamily: FONTS.SemiBold,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: FONTS.Medium,
    marginBottom: 16,
  },
  benefitCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  benefitGradient: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  benefitIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitIcon: {
    fontSize: 24,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    color: 'white',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  platformsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  platformCard: {
    width: (width - 60) / 3,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  platformIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformIcon: {
    fontSize: 18,
  },
  platformName: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: FONTS.Medium,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FONTS.Medium,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 20,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.Medium,
    marginRight: 8,
  },
  buttonIcon: {
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
  },
  footerCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  sparkleContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    top: -15,
    left: -15,
    zIndex: 2,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 14,
    color: '#ffd700',
  },
  sparkle2: {
    top: 5,
    right: 5,
    fontSize: 12,
  },
  sparkle3: {
    bottom: 5,
    left: 5,
    fontSize: 16,
  },
  sparkle4: {
    bottom: 15,
    right: 15,
    fontSize: 5,
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    top: -14,
    left: -14,
    zIndex: -1,
  },
  glowBackground: {
    position: 'absolute',
    width: width * 0.7,
    height: 250,
    top: 0,
    borderRadius: 10000,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 100,
    opacity: 0.5,
  },
  iconSection: {
    position: 'relative',
    marginBottom: 20,
  },
});

export default DoNotDelete;

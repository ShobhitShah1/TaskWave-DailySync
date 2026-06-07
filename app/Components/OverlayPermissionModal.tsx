import { Ionicons } from '@expo/vector-icons';
import React, { FC, memo, useEffect, useState } from 'react';
import {
  Dimensions,
  NativeModules,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  AppState,
} from 'react-native';
import ReactNativeModal from 'react-native-modal';
import Animated, { Easing, FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';

import useOverlayPermission from '@Hooks/useOverlayPermission';

const { width } = Dimensions.get('window');

interface OverlayPermissionModalProps {
  isVisible?: boolean;
  onClose?: () => void;
  autoCheck?: boolean;
}

const OverlayPermissionModal: FC<OverlayPermissionModalProps> = ({
  isVisible: manualVisible,
  onClose,
  autoCheck = true,
}) => {
  const colors = useThemeColors();
  const { hasPermission, requestPermission } = useOverlayPermission();
  const [internalVisible, setInternalVisible] = useState(false);

  useEffect(() => {
    if (autoCheck && hasPermission === false) {
      setInternalVisible(true);
    } else if (hasPermission === true) {
      setInternalVisible(false);
    }
  }, [hasPermission, autoCheck]);

  const isVisible = manualVisible !== undefined ? manualVisible : internalVisible;

  const handleOpenSettings = () => {
    requestPermission();
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalVisible(false);
    }
  };

  if (Platform.OS !== 'android' || !isVisible) {
    return null;
  }

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
      backdropOpacity={0.5}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={colors.background === '#ffffff' ? 'dark-content' : 'light-content'}
          backgroundColor={colors.background}
        />

        <View style={styles.content}>
          <Animated.View
            entering={FadeInUp.delay(300)
              .duration(500)
              .easing(Easing.out(Easing.back(1.5)))}
            style={[styles.iconContainer, { backgroundColor: 'rgba(64, 93, 240, 0.15)' }]}
          >
            <Ionicons name="copy-outline" size={48} color={colors.darkBlue} />
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(400).duration(500).easing(Easing.out(Easing.quad))}
            style={styles.textContainer}
          >
            <Text style={[styles.title, { color: colors.text }]}>Display Over Other Apps</Text>
            <Text style={[styles.description, { color: colors.grayTitle }]}>
              To show the full-screen alarm even while you are using other apps, DailySync needs the
              "Display over other apps" permission.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(500).duration(500).easing(Easing.out(Easing.quad))}
            style={[styles.stepsCard, { backgroundColor: colors.scheduleReminderCardBackground }]}
          >
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.darkBlue }]}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.text }]}>
                Tap <Text style={styles.stepHighlight}>"Enable Permission"</Text>
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
                Toggle <Text style={styles.stepHighlight}>"Allow display over other apps"</Text>
              </Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.actionsContainer}>
          <Pressable
            onPress={handleOpenSettings}
            style={[styles.primaryButton, { backgroundColor: colors.darkBlue }]}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Enable Permission</Text>
          </Pressable>

          <Pressable onPress={handleClose} style={styles.skipButton}>
            <Text style={[styles.skipButtonText, { color: colors.grayTitle }]}>Maybe Later</Text>
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

export default memo(OverlayPermissionModal);

import AssetsPath from '@Constants/AssetsPath';
import { BlurView } from 'expo-blur';
import React, { FC, memo } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import ReactNativeModal from 'react-native-modal';

interface ExitAppModalProps {
  isVisible: boolean;
  onClose: () => void;
  onExit: () => void;
  onMoreApps: () => void;
}

const DESIGN_CARD_WIDTH = 309;
const DESIGN_CARD_HEIGHT = 378;
const SOURCE_CARD_LEFT = 695;
const SOURCE_CARD_TOP = 536;
const SOURCE_CARD_WIDTH = 1580;
const SOURCE_WIDTH = 3000;
const SOURCE_HEIGHT = 2460;
const EXIT_BUTTON_ASPECT_RATIO = 1544 / 380;
const MORE_APPS_BUTTON_ASPECT_RATIO = 1504 / 340;

const ExitAppModal: FC<ExitAppModalProps> = ({ isVisible, onClose, onExit, onMoreApps }) => {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 46, 340);
  const cardHeight = cardWidth * (DESIGN_CARD_HEIGHT / DESIGN_CARD_WIDTH);
  const popupScale = cardWidth / SOURCE_CARD_WIDTH;
  const popupWidth = SOURCE_WIDTH * popupScale;
  const popupHeight = SOURCE_HEIGHT * popupScale;
  const popupLeft = -SOURCE_CARD_LEFT * popupScale;
  const popupTop = -SOURCE_CARD_TOP * popupScale;
  const buttonWidth = cardWidth * (264 / DESIGN_CARD_WIDTH);
  const buttonImageWidth = cardWidth * (303 / DESIGN_CARD_WIDTH);
  const exitButtonTop = cardHeight * (283 / DESIGN_CARD_HEIGHT);
  const moreAppsButtonTop = cardHeight * (332 / DESIGN_CARD_HEIGHT);

  return (
    <ReactNativeModal
      isVisible={isVisible}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={180}
      animationOutTiming={140}
      backdropOpacity={1}
      statusBarTranslucent
      useNativeDriver
      useNativeDriverForBackdrop
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      customBackdrop={
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView
            experimentalBlurMethod="dimezisBlurView"
            intensity={12}
            style={StyleSheet.absoluteFill}
            tint="dark"
          />
          <View style={styles.backdropTint} />
        </Pressable>
      }
      style={styles.modal}
    >
      <View
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
          },
        ]}
      >
        <Image
          fadeDuration={0}
          source={AssetsPath.more_app_popup}
          resizeMode="stretch"
          style={{
            height: popupHeight,
            left: popupLeft,
            position: 'absolute',
            top: popupTop,
            width: popupWidth,
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit App"
          hitSlop={4}
          onPress={onExit}
          style={[
            styles.button,
            {
              top: exitButtonTop,
              width: buttonWidth,
            },
          ]}
        >
          <Image
            source={AssetsPath.exit_button}
            resizeMode="contain"
            style={{
              width: buttonImageWidth,
              height: buttonImageWidth / EXIT_BUTTON_ASPECT_RATIO,
            }}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More Apps"
          hitSlop={4}
          onPress={onMoreApps}
          style={[
            styles.button,
            {
              top: moreAppsButtonTop,
              width: buttonWidth,
            },
          ]}
        >
          <Image
            source={AssetsPath.more_app_button}
            resizeMode="contain"
            style={{
              width: buttonImageWidth,
              height: buttonImageWidth / MORE_APPS_BUTTON_ASPECT_RATIO,
            }}
          />
        </Pressable>
      </View>
    </ReactNativeModal>
  );
};

const styles = StyleSheet.create({
  modal: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
  },
  backdrop: {
    flex: 1,
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(48, 51, 52, 0.52)',
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    justifyContent: 'center',
    transform: [{ translateY: -12 }],
  },
  button: {
    alignItems: 'center',
    height: 35,
    justifyContent: 'center',
    position: 'absolute',
  },
});

export default memo(ExitAppModal);

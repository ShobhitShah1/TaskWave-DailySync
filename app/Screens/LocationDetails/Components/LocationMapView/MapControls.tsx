import AssetsPath from '@Constants/AssetsPath';
import React from 'react';
import { Image, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

interface MapControlsProps {
  onZoomToFit: () => void;
  onCenterUser: () => void;
  showZoomToFit: boolean;
  colors: { background: string; blue: string; text: string };
}

interface MapControlButtonProps {
  onPress: () => void;
  icon: any;
  backgroundColor: string;
  iconColor?: string;
  style?: ViewStyle;
  isFirst?: boolean;
  isLast?: boolean;
}

const MapControlButton: React.FC<MapControlButtonProps> = ({
  onPress,
  icon,
  backgroundColor,
  iconColor,
  style,
  isFirst,
  isLast,
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.controlButton,
      { backgroundColor, opacity: pressed ? 0.8 : 1 },
      isFirst && { borderTopLeftRadius: 18, borderTopRightRadius: 18 },
      isLast && { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
      style,
    ]}
    onPress={onPress}
    accessibilityRole="button"
    android_ripple={{ color: iconColor + '22', borderless: true }}
  >
    <Image
      source={icon}
      style={[styles.controlIcon, iconColor ? { tintColor: iconColor } : {}]}
      resizeMode="contain"
    />
  </Pressable>
);

const MapControls: React.FC<MapControlsProps> = ({
  onZoomToFit,
  onCenterUser,
  showZoomToFit,
  colors,
}) => (
  <View style={[styles.container, { shadowColor: colors.text + '55' }]}>
    <View
      style={[
        styles.buttonGroup,
        { backgroundColor: colors.background, borderColor: colors.text + '11' },
      ]}
    >
      {showZoomToFit && (
        <MapControlButton
          onPress={onZoomToFit}
          icon={AssetsPath.ic_view}
          backgroundColor={colors.background}
          iconColor={colors.blue}
          isFirst
        />
      )}
      {showZoomToFit && <View style={[styles.divider, { backgroundColor: colors.text + '18' }]} />}
      <MapControlButton
        onPress={onCenterUser}
        iconColor={colors.blue}
        backgroundColor={colors.background}
        icon={AssetsPath.ic_history_location_icon}
        isLast
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 9999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonGroup: {
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderWidth: 1,
    backgroundColor: undefined, // will be set via props
    borderColor: undefined, // will be set via props
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 0,
    marginHorizontal: 0,
  },
  controlIcon: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
  divider: {
    width: '70%',
    height: 1.5,
    alignSelf: 'center',
    marginVertical: 2,
    backgroundColor: undefined, // will be set via props
  },
});

export default MapControls;

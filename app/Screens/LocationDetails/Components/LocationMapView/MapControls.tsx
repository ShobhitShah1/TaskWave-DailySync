import AssetsPath from '@Constants/AssetsPath';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

interface MapControlsProps {
  isSatelliteView: boolean;
  onToggleSatellite: () => void;
  onZoomToFit: () => void;
  onCenterUser: () => void;
  showZoomToFit: boolean;
  colors: { background: string; blue: string; text: string };
}

const MapControls: React.FC<MapControlsProps> = ({
  isSatelliteView,
  onToggleSatellite,
  onZoomToFit,
  onCenterUser,
  showZoomToFit,
  colors,
}) => (
  <>
    {/* Satellite toggle button - top right */}
    <View style={styles.satelliteToggleContainer}>
      <Pressable
        style={[styles.controlButton, { backgroundColor: colors.background }]}
        onPress={onToggleSatellite}
      >
        <Image
          source={isSatelliteView ? AssetsPath.ic_view : AssetsPath.ic_fullScreen}
          style={[styles.controlIcon, { tintColor: isSatelliteView ? colors.blue : colors.text }]}
          resizeMode="contain"
        />
      </Pressable>
    </View>

    {/* Zoom to fit all button - top right */}
    {showZoomToFit && (
      <View style={styles.zoomFitContainer}>
        <Pressable
          style={[styles.controlButton, { backgroundColor: colors.background }]}
          onPress={onZoomToFit}
        >
          <Image
            source={AssetsPath.ic_view}
            style={[styles.controlIcon, { tintColor: colors.blue }]}
            resizeMode="contain"
          />
        </Pressable>
      </View>
    )}

    {/* Floating action button to center on user - bottom right */}
    <View style={styles.fabContainer}>
      <Pressable
        style={[styles.fab, { backgroundColor: colors.background }]}
        onPress={onCenterUser}
      >
        <Image
          source={AssetsPath.ic_location}
          style={[styles.fabIcon, { tintColor: colors.blue }]}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  </>
);

const styles = StyleSheet.create({
  satelliteToggleContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 30,
    elevation: 12,
  },
  zoomFitContainer: {
    position: 'absolute',
    top: 16,
    right: 70, // Adjust position to be next to satellite toggle
    zIndex: 30,
    elevation: 12,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    zIndex: 30,
    elevation: 12,
  },
  fab: {
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    width: 24,
    height: 24,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  controlIcon: {
    width: 24,
    height: 24,
  },
});

export default MapControls;

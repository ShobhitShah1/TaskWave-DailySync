import React from 'react';
import { StyleSheet, View } from 'react-native';

interface MapMarkerProps {
  color: string;
  backgroundColor: string;
}

const MapMarker: React.FC<MapMarkerProps> = ({ color, backgroundColor }) => (
  <View style={styles.markerContainer}>
    <View style={[styles.markerOuterRing, { backgroundColor: color }]} />
    <View style={[styles.markerInnerCircle, { backgroundColor }]} />
    <View style={[styles.markerCenter, { backgroundColor: color }]} />
  </View>
);

const styles = StyleSheet.create({
  markerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 20,
  },
  markerOuterRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.3,
    zIndex: 19,
  },
  markerInnerCircle: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    zIndex: 20,
  },
  markerCenter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 21,
  },
});

export default MapMarker;

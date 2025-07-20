import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import AssetsPath from '@Constants/AssetsPath';

interface MapMarkerProps {
  color: string;
  backgroundColor: string;
}

const MapMarker: React.FC<MapMarkerProps> = ({ color, backgroundColor }) => (
  <View style={[styles.markerContainer, { backgroundColor: color }]}>
    <Image
      source={AssetsPath.ic_history_location_icon}
      style={[styles.icon, { tintColor: 'red' }]}
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    // No border, no shadow for a clean look
  },
  icon: {
    width: 30,
    height: 30,
  },
});

export default MapMarker;

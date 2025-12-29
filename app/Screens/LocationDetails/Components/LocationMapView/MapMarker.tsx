import AssetsPath from '@Constants/AssetsPath';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const MapMarker = () => {
  return (
    <View style={styles.markerContainer}>
      <Image
        source={AssetsPath.ic_history_location_icon}
        style={styles.icon}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 30,
    height: 30,
  },
});

export default MapMarker;

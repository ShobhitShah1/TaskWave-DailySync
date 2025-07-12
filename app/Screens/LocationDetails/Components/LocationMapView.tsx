import { useAppContext } from '@contexts/ThemeProvider';
import React, { useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import MapView, { LatLng, MapPressEvent, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

import AssetsPath from '../../../Constants/AssetsPath';

const DEFAULT_MARKERS = [
  {
    id: '1',
    coordinate: { latitude: 37.78825, longitude: -122.4324 },
    icon: AssetsPath.ic_history_location_icon,
  },
  {
    id: '2',
    coordinate: { latitude: 37.78925, longitude: -122.4314 },
    icon: AssetsPath.ic_history_location_icon,
  },
  {
    id: '3',
    coordinate: { latitude: 37.78725, longitude: -122.4334 },
    icon: AssetsPath.ic_history_location_icon,
  },
];

const INITIAL_REGION: Region = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

interface LocationMapViewProps {
  onLocationSelect: (coordinate: LatLng) => void;
  selectedLocation: LatLng | null;
  children?: React.ReactNode;
}

const LocationMapView: React.FC<LocationMapViewProps> = ({
  onLocationSelect,
  selectedLocation,
  children,
}) => {
  const { theme } = useAppContext();
  const [region] = useState(INITIAL_REGION);
  const [markers] = useState(DEFAULT_MARKERS);
  const mapRef = useRef<MapView>(null);

  const handleMapPress = (e: MapPressEvent) => {
    const { coordinate } = e.nativeEvent;
    console.log('coordinate', coordinate);
    onLocationSelect(coordinate);
  };

  const centerOnUser = () => {
    // This is a placeholder; in a real app, get user location from permissions
    mapRef.current?.animateToRegion(INITIAL_REGION, 500);
  };

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation
        onPress={handleMapPress}
        liteMode={theme === 'light'}
      >
        {markers.map((marker) => (
          <Marker key={marker.id} coordinate={marker.coordinate} image={marker.icon} />
        ))}
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            image={AssetsPath.ic_play}
            title="Selected Location"
          />
        )}
      </MapView>
      {children}
      <Pressable style={styles.fab} onPress={centerOnUser}>
        <Image source={AssetsPath.ic_view} resizeMode="contain" style={styles.fabIcon} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    // position: 'relative',
    // borderRadius: 18,
    // overflow: 'hidden',
    // marginHorizontal: 10,
    // marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 18,
    backgroundColor: '#fff',
    borderRadius: 28,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  fabIcon: {
    width: 28,
    height: 28,
    tintColor: '#303334',
  },
});

export default LocationMapView;

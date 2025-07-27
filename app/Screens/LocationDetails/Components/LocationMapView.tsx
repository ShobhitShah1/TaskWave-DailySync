import {
  Camera as MapCamera,
  MapView,
  PointAnnotation,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import type { Feature, GeoJsonProperties, Geometry, Point } from 'geojson';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import satelliteStyle from '@Constants/satellite-style.json';
import useThemeColors from '@Hooks/useThemeMode';
import LocationService from '@Services/LocationService';
import { CameraPosition, GeoLatLng, LocationMapViewProps } from '@Types/Interface';
import { fitBoundsZoomLevel } from '@Utils/geoUtils';
import MapControls from './LocationMapView/MapControls';
import MapMarker from './LocationMapView/MapMarker';

const LocationMapView: React.FC<LocationMapViewProps> = ({
  onLocationSelect,
  selectedLocation,
  children,
  userLocation: userLocationProp,
}) => {
  const colors = useThemeColors();
  const cameraRef = useRef<any>(null);

  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>(
    userLocationProp
      ? {
          centerCoordinate: [userLocationProp.longitude, userLocationProp.latitude],
          zoomLevel: 15,
        }
      : (undefined as any), // will be set when userLocation is available
  );

  useEffect(() => {
    if (selectedLocation && isMapReady) {
      if (
        cameraRef.current &&
        typeof cameraRef.current.flyTo === 'function' &&
        typeof cameraRef.current.setZoom === 'function'
      ) {
        cameraRef.current.flyTo([selectedLocation.longitude, selectedLocation.latitude], 800);
        cameraRef.current.setZoom(17);
      } else {
        setCameraPosition({
          centerCoordinate: [selectedLocation.longitude, selectedLocation.latitude],
          zoomLevel: 17,
          animationDuration: 800,
        });
      }
    }
  }, [selectedLocation, isMapReady]);

  useEffect(() => {
    if (isMapReady && selectedLocation) {
      if (
        cameraRef.current &&
        typeof cameraRef.current.flyTo === 'function' &&
        typeof cameraRef.current.setZoom === 'function'
      ) {
        cameraRef.current.flyTo([selectedLocation.longitude, selectedLocation.latitude], 800);
        cameraRef.current.setZoom(17);
      } else {
        setCameraPosition({
          centerCoordinate: [selectedLocation.longitude, selectedLocation.latitude],
          zoomLevel: 17,
          animationDuration: 800,
        });
      }
    }
  }, [isMapReady, selectedLocation]);

  const handleMapPress = useCallback(
    (feature: Feature<Geometry, GeoJsonProperties>) => {
      try {
        if (feature.geometry?.type === 'Point') {
          const coordinates = (feature.geometry as Point).coordinates;
          const coordinate: GeoLatLng = {
            latitude: coordinates[1],
            longitude: coordinates[0],
          };
          onLocationSelect(coordinate);
        }
      } catch (error) {
        console.error('Error handling map press:', error);
      }
    },
    [onLocationSelect],
  );

  const handleMapReady = useCallback(() => {
    setIsMapReady(true);
  }, []);

  const centerOnUser = useCallback(async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        const currentLocation: GeoLatLng = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setCameraPosition({
          centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
          zoomLevel: 16,
          animationDuration: 800,
        });
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get current location. Please check location permissions.',
        );
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Unable to get current location. Please check location permissions.');
    }
  }, []);

  const zoomToFitAll = useCallback(async () => {
    try {
      const location = await LocationService.getCurrentLocation();

      if (location && selectedLocation) {
        const currentLocation: GeoLatLng = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        const { center, zoomLevel } = fitBoundsZoomLevel(currentLocation, selectedLocation);
        setCameraPosition({
          centerCoordinate: [center.longitude, center.latitude],
          zoomLevel,
          animationDuration: 1000,
        });
      } else if (location) {
        centerOnUser();
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get current location. Please check location permissions.',
        );
      }
    } catch (error) {
      console.error('Error zooming to fit all:', error);
      Alert.alert('Error', 'Unable to zoom to fit all locations.');
    }
  }, [selectedLocation, centerOnUser]);

  return (
    <View style={styles.mapContainer}>
      {userLocationProp && (
        <MapView
          style={styles.map}
          mapStyle={satelliteStyle}
          compassEnabled
          onPress={handleMapPress}
          onDidFinishLoadingMap={handleMapReady}
          zoomEnabled
          scrollEnabled
          pitchEnabled
          rotateEnabled
          attributionEnabled
          attributionPosition={{ bottom: 8, left: 8 }}
          preferredFramesPerSecond={60}
          localizeLabels
        >
          <MapCamera
            ref={cameraRef}
            centerCoordinate={cameraPosition.centerCoordinate}
            zoomLevel={cameraPosition.zoomLevel}
            animationDuration={cameraPosition.animationDuration}
            pitch={45}
            heading={0}
            minZoomLevel={2}
            maxZoomLevel={20}
          />
          {selectedLocation && (
            <PointAnnotation
              id={`selected-location-${selectedLocation.longitude}-${selectedLocation.latitude}`}
              coordinate={[selectedLocation.longitude, selectedLocation.latitude]}
            >
              <MapMarker />
            </PointAnnotation>
          )}
          <UserLocation visible={true} onUpdate={() => {}} />
        </MapView>
      )}
      <MapControls
        onZoomToFit={zoomToFitAll}
        onCenterUser={() => {
          centerOnUser();
        }}
        showZoomToFit={!!selectedLocation}
        colors={{ background: colors.background, blue: colors.blue, text: colors.text }}
      />
      {children}
    </View>
  );
};

export default LocationMapView;

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    marginHorizontal: 10,
    marginBottom: 0,
    zIndex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

import { Camera, MapView, PointAnnotation, UserLocation } from '@maplibre/maplibre-react-native';
import { Feature, GeoJsonProperties, Geometry, Point } from 'geojson';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import satelliteStyle from '@Constants/satellite-style.json';
import useThemeColors from '@Hooks/useThemeMode';
import LocationService from '@Services/LocationService';
import {
  CameraPosition,
  GeoLatLng,
  LocationMapViewProps,
  MapLibreUserLocationEvent,
} from '@Types/Interface';
import { getCenterBetweenPoints, getZoomLevelForPoints } from '@Utils/geoUtils';
import MapControls from './LocationMapView/MapControls';
import MapMarker from './LocationMapView/MapMarker';

const DEFAULT_LOCATION: GeoLatLng = {
  latitude: -23.5489,
  longitude: -46.6388,
};

const LocationMapView: React.FC<LocationMapViewProps> = ({
  onLocationSelect,
  selectedLocation,
  children,
}) => {
  const colors = useThemeColors();
  const cameraRef = useRef<null>(null);

  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<GeoLatLng | null>(null);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>({
    centerCoordinate: [DEFAULT_LOCATION.longitude, DEFAULT_LOCATION.latitude],
    zoomLevel: 15,
  });

  // Center camera on selected location or user location
  useEffect(() => {
    if (selectedLocation && isMapReady) {
      setCameraPosition({
        centerCoordinate: [selectedLocation.longitude, selectedLocation.latitude],
        zoomLevel: 17,
        animationDuration: 800, // smoother animation
      });
    }
  }, [selectedLocation, isMapReady]);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const location = await LocationService.getCurrentLocation();
        if (location) {
          const currentLocation: GeoLatLng = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(currentLocation);
          if (!selectedLocation) {
            setCameraPosition({
              centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
              zoomLevel: 16,
              animationDuration: 800,
            });
          }
        }
      } catch (error) {
        console.error('Error getting current location:', error);
        Alert.alert(
          'Location Error',
          'Unable to get current location. Please check location permissions.',
        );
      }
    };
    getCurrentLocation();
  }, [selectedLocation]);

  // Handle map press to select a location
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

  // Center camera on user location
  const centerOnUser = useCallback(async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        const currentLocation: GeoLatLng = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(currentLocation);
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

  // Zoom to fit both user and selected location
  const zoomToFitAll = useCallback(async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (location && selectedLocation) {
        const currentLocation: GeoLatLng = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        const center = getCenterBetweenPoints(currentLocation, selectedLocation);
        const zoomLevel = getZoomLevelForPoints(currentLocation, selectedLocation);
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
      <MapView
        style={styles.map}
        mapStyle={satelliteStyle}
        compassEnabled
        logoEnabled
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
        <Camera
          ref={cameraRef}
          centerCoordinate={cameraPosition.centerCoordinate}
          zoomLevel={cameraPosition.zoomLevel}
          animationDuration={cameraPosition.animationDuration}
          pitch={45}
          heading={0}
          minZoomLevel={2}
          maxZoomLevel={20}
        />
        {/* Marker for selected location */}
        {selectedLocation && (
          <PointAnnotation
            id="selected-location"
            coordinate={[selectedLocation.longitude, selectedLocation.latitude]}
          >
            <MapMarker color={colors.blue} backgroundColor={colors.background} />
          </PointAnnotation>
        )}
        {/* Marker for user location if no selected location */}
        {!selectedLocation && userLocation && (
          <PointAnnotation
            id="user-location"
            coordinate={[userLocation.longitude, userLocation.latitude]}
          >
            <MapMarker color={colors.text} backgroundColor={colors.blue} />
          </PointAnnotation>
        )}
        <UserLocation
          visible={true}
          onUpdate={(location: MapLibreUserLocationEvent) => {
            if (location.coords) {
              setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          }}
        />
      </MapView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  addressInfoBox: {
    minWidth: 120,
    maxWidth: 220,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'absolute',
    bottom: 48,
    left: '50%',
    transform: [{ translateX: -110 }], // half of maxWidth
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  addressInfoBoxArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 8,
    backgroundColor: 'transparent',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff', // will be overridden by theme
    zIndex: 11,
  },
  addressInfoBoxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  addressText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  addressOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    top: 60, // adjust as needed to appear above marker
    zIndex: 99999,
    pointerEvents: 'none',
  },
});

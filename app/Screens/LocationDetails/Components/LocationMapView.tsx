import { Camera, MapView, PointAnnotation, UserLocation } from '@maplibre/maplibre-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Feature, Geometry, GeoJsonProperties, Point } from 'geojson';

import useThemeColors from '../../../Hooks/useThemeMode';
import LocationService from '../../../Services/LocationService';
import MapMarker from './LocationMapView/MapMarker';
import MapControls from './LocationMapView/MapControls';
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE, SATELLITE_MAP_STYLE } from './LocationMapView/MapStyles';
import {
  CameraPosition,
  GeoLatLng,
  LocationMapViewProps,
  MapLibreUserLocationEvent,
} from '../../../Types/Interface';
import { getCenterBetweenPoints, getZoomLevelForPoints } from '../../../Utils/geoUtils';

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
  const [isSatelliteView, setIsSatelliteView] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>({
    centerCoordinate: [DEFAULT_LOCATION.longitude, DEFAULT_LOCATION.latitude],
    zoomLevel: 15,
  });

  useEffect(() => {
    if (selectedLocation && isMapReady) {
      setCameraPosition({
        centerCoordinate: [selectedLocation.longitude, selectedLocation.latitude],
        zoomLevel: 17,
        animationDuration: 1000,
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
              animationDuration: 1000,
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

  const getMapStyle = () => {
    if (isSatelliteView) return SATELLITE_MAP_STYLE;
    return colors.background === 'rgba(48, 51, 52, 1)' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;
  };

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
        console.log('Map press event:', feature);
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
        setUserLocation(currentLocation);
        setCameraPosition({
          centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
          zoomLevel: 16,
          animationDuration: 1000,
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
        const center = getCenterBetweenPoints(currentLocation, selectedLocation);
        const zoomLevel = getZoomLevelForPoints(currentLocation, selectedLocation);
        setCameraPosition({
          centerCoordinate: [center.longitude, center.latitude],
          zoomLevel,
          animationDuration: 1500,
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

  const toggleSatelliteView = useCallback(() => {
    setIsSatelliteView((prev) => !prev);
  }, []);

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        mapStyle={getMapStyle()}
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
          minZoomLevel={10}
          maxZoomLevel={20}
        />
        {selectedLocation && (
          <PointAnnotation
            id="selected-location"
            coordinate={[selectedLocation.longitude, selectedLocation.latitude]}
          >
            <MapMarker color={colors.blue} backgroundColor={colors.background} />
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
        isSatelliteView={isSatelliteView}
        onToggleSatellite={toggleSatelliteView}
        onZoomToFit={zoomToFitAll}
        onCenterUser={centerOnUser}
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
});

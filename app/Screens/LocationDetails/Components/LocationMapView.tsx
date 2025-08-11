import AssetsPath from '@Constants/AssetsPath';
import streetsStyle from '@Constants/streets-v2-style.json';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import useThemeColors from '@Hooks/useThemeMode';
import {
  Logger,
  Camera as MapCamera,
  MapView,
  PointAnnotation,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import LocationService from '@Services/LocationService';
import { CameraPosition, GeoLatLng, LocationMapViewProps } from '@Types/Interface';
import type { Feature, GeoJsonProperties, Geometry, Point } from 'geojson';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, Keyboard, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LocationDetailsCard from './LocationDetailsCard';
import MapMarker from './LocationMapView/MapMarker';

Logger.setLogCallback((log) => {
  const { message } = log;

  if (message.match('Request failed due to a permanent error: Canceled')) {
    return true;
  }
  return false;
});

const snapPoints = [40, 325];

const LocationMapView: React.FC<LocationMapViewProps> = ({
  onLocationSelect,
  selectedLocation,
  children,
  userLocation: userLocationProp,
  title,
  setTitle,
  message,
  setMessage,
  validateAndSubmit,
  isLoading,
  id,
  bottomSheetRef,
  address,
  setAddress,
}) => {
  const colors = useThemeColors();
  const cameraRef = useRef<any>(null);
  const containerRef = useRef<View>(null);

  const animatedPosition = useSharedValue(0);
  const keyboardVisible = useSharedValue(0);
  const [containerLayout, setContainerLayout] = useState({ height: 0 });

  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>(
    userLocationProp
      ? {
          centerCoordinate: [userLocationProp.longitude, userLocationProp.latitude],
          zoomLevel: 15,
        }
      : (undefined as any),
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      keyboardVisible.value = withTiming(1, { duration: 250 });
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisible.value = withTiming(0, { duration: 250 });
    });

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

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

  const handleContainerLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout;
    setContainerLayout({ height });
  }, []);

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
      if (userLocationProp && selectedLocation) {
        cameraRef.current?.fitBounds(
          [userLocationProp.longitude, userLocationProp.latitude],
          [selectedLocation.longitude, selectedLocation.latitude],
          [100, 100, 100, 100],
          1000,
        );
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
    }
  }, [selectedLocation, centerOnUser]);

  const floatingButtonStyle = useAnimatedStyle(() => {
    'worklet';

    if (containerLayout.height === 0) {
      return { opacity: 0 };
    }

    // Calculate bottom sheet height from animated position
    const currentSheetHeight = containerLayout.height - animatedPosition.value;

    // Position button 60px above the bottom sheet (increased for better spacing)
    const buttonBottom = currentSheetHeight + 10; // 15px from bottom sheet top

    // Hide button when keyboard is visible
    const opacity = interpolate(keyboardVisible.value, [0, 1], [1, 0], 'clamp');
    const translateY = interpolate(keyboardVisible.value, [0, 1], [0, 50], 'clamp');

    return {
      bottom: buttonBottom,
      opacity,
      transform: [
        { translateY },
        // {
        //   scale: interpolate(currentSheetHeight, [snapPoints[0], snapPoints[1]], [0.9, 1], 'clamp'),
        // },
      ],
    };
  }, [containerLayout.height]);

  return (
    <View ref={containerRef} style={styles.mapContainer} onLayout={handleContainerLayout}>
      {userLocationProp && (
        <MapView
          style={styles.map}
          mapStyle={streetsStyle}
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
            maxZoomLevel={22}
            animationMode="linearTo"
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

      <Animated.View style={[styles.floatingButton, floatingButtonStyle]}>
        <Pressable
          style={styles.buttonTouchable}
          onPress={zoomToFitAll}
          android_ripple={{ color: 'rgba(255,255,255,0.2)', radius: 25 }}
        >
          <Image source={AssetsPath.ic_fullScreen} style={styles.buttonIcon} resizeMode="contain" />
        </Pressable>
      </Animated.View>

      <BottomSheet
        handleStyle={{
          borderBottomWidth: 0.5,
          borderColor: colors.background,
          backgroundColor: colors.background,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.text }}
        style={{
          borderBottomWidth: 0,
          zIndex: 999999999,
          backgroundColor: colors.background,
        }}
        backgroundStyle={{
          backgroundColor: colors.background,
        }}
        animatedPosition={animatedPosition}
        snapPoints={snapPoints}
        ref={bottomSheetRef}
        keyboardBlurBehavior="restore"
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustPan"
      >
        <BottomSheetView style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          <LocationDetailsCard
            title={title}
            setTitle={setTitle}
            message={message}
            setMessage={setMessage}
            onCreate={validateAndSubmit}
            isLoading={isLoading}
            isUpdate={!!id}
            address={address}
            setAddress={setAddress}
          />
        </BottomSheetView>
      </BottomSheet>
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
  contentContainer: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    right: 8,
    width: 50,
    height: 50,
    borderRadius: 26,
    backgroundColor: '#405DF0',
    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.25)',
    zIndex: 1000,
  },
  buttonTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    overflow: 'hidden',
  },
  buttonIcon: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
});

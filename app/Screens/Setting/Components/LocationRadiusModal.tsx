import React, { FC, memo, useState, useEffect, useMemo, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View, Dimensions } from 'react-native';
import ReactNativeModal from 'react-native-modal';
import { BlurView } from 'expo-blur';
import {
  MapView,
  Camera as MapCamera,
  ShapeSource,
  FillLayer,
  LineLayer,
  UserLocation,
  Logger,
} from '@maplibre/maplibre-react-native';

import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import { useAppContext } from '@Contexts/ThemeProvider';
import { useLocation } from '@Contexts/LocationProvider';
import { RADIUS_OPTIONS } from '@Contexts/SettingsProvider';
import { createGeoJSONCircle } from '@Utils/createGeoJSONCircle';
import { getMapStyleUrl } from '@Utils/mapStyles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Suppress MapLibre warnings
Logger.setLogCallback((log) => {
  const { message } = log;
  if (message.match(/Request failed due to a permanent error.*Canceled/i)) return true;
  if (message.match(/stream was reset.*CANCEL/i)) return true;
  if (message.match(/source must have tiles/i)) return true;
  return false;
});

interface LocationRadiusModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentRadius: number;
  onSelectRadius: (radius: number) => void;
}

const LocationRadiusModal: FC<LocationRadiusModalProps> = ({
  isVisible,
  onClose,
  currentRadius,
  onSelectRadius,
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const { userLocation } = useLocation();
  const style = styles(colors, theme);
  const mapStyleUrl = useMemo(() => getMapStyleUrl(theme), [theme]);
  const cameraRef = useRef<any>(null);

  const [selectedRadius, setSelectedRadius] = useState(currentRadius);
  const [isMapReady, setIsMapReady] = useState(true);

  useEffect(() => {
    setSelectedRadius(currentRadius);
  }, [currentRadius, isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setIsMapReady(false);
    }
  }, [isVisible]);

  const radiusCircle = useMemo(() => {
    if (!userLocation) return null;
    return createGeoJSONCircle(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      selectedRadius,
    );
  }, [userLocation, selectedRadius]);

  const zoomLevel = useMemo(() => {
    if (selectedRadius === 50) return 16.6;
    if (selectedRadius === 100) return 15.6;
    if (selectedRadius === 200) return 14.6;
    if (selectedRadius === 300) return 14;
    if (selectedRadius === 500) return 13.5;
    if (selectedRadius === 1000) return 12.5;
    if (selectedRadius === 2000) return 11.5;
    if (selectedRadius === 5000) return 10.2;
    return 11.5;
  }, [selectedRadius]);

  useEffect(() => {
    if (cameraRef.current && userLocation && isVisible) {
      cameraRef.current.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
        zoomLevel: zoomLevel,
        animationDuration: 300,
        animationMode: 'easeTo',
      });
    }
  }, [selectedRadius, userLocation, zoomLevel, isVisible]);

  const handleSelect = (radius: number) => {
    setSelectedRadius(radius);
  };

  const handleConfirm = () => {
    onSelectRadius(selectedRadius);
    onClose();
  };

  const formatRadiusDisplay = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)} km`;
    }
    return `${meters}m`;
  };

  return (
    <ReactNativeModal
      isVisible={isVisible}
      animationInTiming={400}
      animationOutTiming={200}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      hideModalContentWhileAnimating
      customBackdrop={
        <Pressable style={style.customBackdrop} onPress={onClose}>
          <BlurView
            style={style.customBackdrop}
            intensity={20}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
          />
        </Pressable>
      }
      hasBackdrop
      useNativeDriver={true}
      onBackButtonPress={onClose}
      onBackdropPress={onClose}
      style={style.modalContainer}
      backdropOpacity={1}
      useNativeDriverForBackdrop
      deviceHeight={Dimensions.get('screen').height}
    >
      <View style={style.mainContainer}>
        <View style={style.headerContainer}>
          <View style={style.iconWrapper}>
            <Image
              source={AssetsPath.ic_location_history}
              style={style.headerIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={style.title}>Notification Radius</Text>
        </View>

        <View style={style.mapContainer}>
          {userLocation ? (
            <MapView
              style={style.map}
              mapStyle={mapStyleUrl}
              compassEnabled={false}
              zoomEnabled={false}
              scrollEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              attributionEnabled={false}
              logoEnabled={false}
              onDidFinishLoadingMap={() => {
                setIsMapReady(true);
                if (cameraRef.current && userLocation) {
                  cameraRef.current.setCamera({
                    centerCoordinate: [userLocation.longitude, userLocation.latitude],
                    zoomLevel: zoomLevel,
                    animationDuration: 0,
                  });
                }
              }}
            >
              <MapCamera
                ref={cameraRef}
                centerCoordinate={[userLocation.longitude, userLocation.latitude]}
                zoomLevel={zoomLevel}
                animationDuration={0}
              />
              <UserLocation visible={true} />
              {radiusCircle && (
                <ShapeSource id="radius-preview-source" shape={radiusCircle}>
                  <FillLayer
                    id="radius-preview-fill"
                    style={{
                      fillColor: '#405DF0',
                      fillOpacity: 0.2,
                    }}
                  />
                  <LineLayer
                    id="radius-preview-border"
                    style={{
                      lineColor: '#405DF0',
                      lineWidth: 3,
                      lineOpacity: 0.8,
                    }}
                  />
                </ShapeSource>
              )}
            </MapView>
          ) : (
            <View style={style.mapPlaceholder}>
              <Image
                source={AssetsPath.ic_location_normal}
                style={style.placeholderIcon}
                resizeMode="contain"
              />
              <Text style={style.placeholderText}>Location unavailable</Text>
            </View>
          )}

          <View style={style.radiusBadge}>
            <Text style={style.radiusBadgeText}>{formatRadiusDisplay(selectedRadius)}</Text>
          </View>
        </View>

        <View style={style.optionsContainer}>
          <Text style={style.optionsLabel}>Select Trigger Distance</Text>
          <View style={style.optionsGrid}>
            {RADIUS_OPTIONS.map((option) => {
              const isSelected = option.value === selectedRadius;
              return (
                <Pressable
                  key={option.value}
                  style={[style.optionItem, isSelected && style.optionItemSelected]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={[style.optionLabel, isSelected && style.optionLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={style.buttonContainer}>
          <Pressable style={style.cancelButton} onPress={onClose}>
            <Text style={style.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable style={style.confirmButton} onPress={handleConfirm}>
            <Text style={style.confirmButtonText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </ReactNativeModal>
  );
};

const styles = (colors: any, theme: string) =>
  StyleSheet.create({
    modalContainer: {
      margin: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    customBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    mainContainer: {
      width: SCREEN_WIDTH - 32,
      backgroundColor: theme === 'dark' ? '#1E2124' : '#FFFFFF',
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 25,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      gap: 12,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(64, 93, 240, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerIcon: {
      width: 24,
      height: 24,
      tintColor: '#405DF0',
    },
    title: {
      fontFamily: FONTS.SemiBold,
      fontSize: 20,
      color: theme === 'dark' ? '#FFFFFF' : '#1A1A1A',
    },
    mapContainer: {
      height: 200,
      marginHorizontal: 16,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme === 'dark' ? '#2A2D30' : '#F0F2F5',
    },
    map: {
      flex: 1,
    },
    mapPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    placeholderIcon: {
      width: 40,
      height: 40,
      tintColor: theme === 'dark' ? '#666' : '#AAA',
      opacity: 0.5,
    },
    placeholderText: {
      fontFamily: FONTS.Regular,
      fontSize: 14,
      color: theme === 'dark' ? '#666' : '#AAA',
    },
    radiusBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: '#405DF0',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      shadowColor: '#405DF0',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
    },
    radiusBadgeText: {
      fontFamily: FONTS.Bold,
      fontSize: 16,
      color: '#FFFFFF',
    },
    optionsContainer: {
      padding: 16,
    },
    optionsLabel: {
      fontFamily: FONTS.Medium,
      fontSize: 13,
      color: theme === 'dark' ? '#888' : '#666',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    optionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    optionItem: {
      width: (SCREEN_WIDTH - 32 - 32 - 30) / 4,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionItemSelected: {
      backgroundColor: 'rgba(64, 93, 240, 0.15)',
      borderColor: '#405DF0',
    },
    optionLabel: {
      fontFamily: FONTS.Medium,
      fontSize: 14,
      color: theme === 'dark' ? '#CCCCCC' : '#333333',
    },
    optionLabelSelected: {
      fontFamily: FONTS.SemiBold,
      color: '#405DF0',
    },
    buttonContainer: {
      flexDirection: 'row',
      padding: 16,
      paddingTop: 8,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    cancelButtonText: {
      fontFamily: FONTS.SemiBold,
      fontSize: 16,
      color: theme === 'dark' ? '#FFFFFF' : '#333333',
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#405DF0',
    },
    confirmButtonText: {
      fontFamily: FONTS.SemiBold,
      fontSize: 16,
      color: '#FFFFFF',
    },
  });

export default memo(LocationRadiusModal);

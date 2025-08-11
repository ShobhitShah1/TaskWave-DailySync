import AssetsPath from '@Constants/AssetsPath';
import streetsStyle from '@Constants/streets-v2-style.json';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useAddressFromCoords } from '@Hooks/useAddressFromCoords';
import { useLiveLocation } from '@Hooks/useLiveLocation';
import useLocationNotification from '@Hooks/useLocationNotification';
import useThemeColors from '@Hooks/useThemeMode';
import {
  Camera,
  FillLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
} from '@maplibre/maplibre-react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { navigationRef } from '@Routes/RootNavigation';
import { GeoLatLng, Notification } from '@Types/Interface';
import { createGeoJSONCircle } from '@Utils/createGeoJSONCircle';
import { linkifyText } from '@Utils/linkify';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type LocationPreviewRoute = RouteProp<{ params: { notificationData: Notification } }, 'params'>;

const calculateDistance = (lat1: number, lon1: number, lat2: any, lon2: any) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
const LocationPreview = () => {
  const { theme } = useAppContext();
  const colors = useThemeColors();

  const { params } = useRoute<LocationPreviewRoute>();
  const notification = params.notificationData;

  const locationOptions = useMemo(
    () => ({
      timeInterval: 10000,
      distanceInterval: 100,
    }),
    [],
  );

  const { location: currentLocation, permissionStatus } = useLiveLocation(locationOptions);

  const [estimatedTime, setEstimatedTime] = useState<{
    distance: number;
    walking: number;
    driving: number;
  } | null>(null);
  const cameraRef = useRef<any>(null);

  const fadeValue = useSharedValue(0);
  const slideValue = useSharedValue(-100);
  const scaleValue = useSharedValue(0.8);
  const markerPulseValue = useSharedValue(1);

  useEffect(() => {
    fadeValue.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    slideValue.value = withDelay(
      100,
      withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
      }),
    );

    scaleValue.value = withDelay(
      200,
      withSpring(1, {
        damping: 12,
        stiffness: 120,
        mass: 1,
      }),
    );
  }, []);

  // Marker pulse animation
  useEffect(() => {
    const markerPulseAnimation = () => {
      markerPulseValue.value = withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      );
    };

    const interval = setInterval(markerPulseAnimation, 4000);
    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   if (notification.latitude && notification.longitude && cameraRef.current) {
  //     cameraRef.current.setCamera({
  //       centerCoordinate: [notification.longitude, notification.latitude],
  //       animationDuration: 1200,
  //     });
  //   }
  // }, [notification]);

  // Calculate estimated travel time and distance
  useEffect(() => {
    if (currentLocation && notification.latitude && notification.longitude) {
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        notification.latitude,
        notification.longitude,
      );

      // Rough estimation: 5 km/h walking, 40 km/h driving
      const walkingTime = Math.round((distance / 5) * 60); // minutes
      const drivingTime = Math.round((distance / 40) * 60); // minutes

      setEstimatedTime({
        distance: distance,
        walking: walkingTime,
        driving: drivingTime,
      });
    }
  }, [currentLocation, notification.latitude, notification.longitude]);

  const snapPoints = useMemo(() => ['16%', '60%', '90%'], []);

  const zoomToFitAll = useCallback(async () => {
    try {
      if (
        currentLocation?.coords?.longitude &&
        currentLocation?.coords.latitude &&
        notification.longitude &&
        notification.latitude
      ) {
        cameraRef.current?.fitBounds(
          [notification.longitude, notification.latitude],
          [currentLocation.coords.longitude, currentLocation.coords.latitude],
          [100, 100, 100, 100],
          1000,
        );
      } else if (notification) {
        handleMarkedLocationClick();
      } else {
        Alert.alert(
          'Location Error',
          'Unable to get current location. Please check location permissions.',
        );
      }
    } catch (error) {
      console.error('Error zooming to fit all:', error);
    }
  }, [currentLocation, notification]);

  const handleMarkedLocationClick = () => {
    scaleValue.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 }),
    );

    if (currentLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [notification.longitude, notification.latitude],
        animationDuration: 1000,
        zoomLevel: 16,
      });
    }
  };

  const coords = useMemo(
    () => ({
      latitude: notification.latitude as number,
      longitude: notification.longitude as number,
    }),
    [notification.latitude, notification.longitude],
  );

  const { address, loading } = useAddressFromCoords(coords);

  const circleGeoJSON = useMemo(
    () => (notification.radius ? createGeoJSONCircle(coords, notification.radius) : null),
    [coords, notification.radius],
  );

  // Open location in Google Maps
  const openInGoogleMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${coords.latitude},${coords.longitude}`,
      android: `geo:0,0?q=${coords.latitude},${coords.longitude}`,
    });

    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;

    if (!url) {
      return;
    }

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(fallbackUrl);
      }
    });
  };

  // Open in navigation apps
  const openNavigation = () => {
    if (Platform.OS === 'android') {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`;
      Linking.openURL(url);
      return;
    }

    Alert.alert('Navigate with', 'Choose your preferred navigation app', [
      {
        text: 'Google Maps',
        onPress: () => {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.latitude},${coords.longitude}`;
          Linking.openURL(url);
        },
      },
      {
        text: 'Apple Maps',
        onPress: () => {
          const url = `http://maps.apple.com/?daddr=${coords.latitude},${coords.longitude}`;
          Linking.openURL(url);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeValue.value,
      transform: [{ translateY: slideValue.value }],
    };
  });

  const errorContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeValue.value,
      transform: [{ scale: scaleValue.value }, { translateY: slideValue.value }],
    };
  });

  if (typeof notification.latitude !== 'number' || typeof notification.longitude !== 'number') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Animated.View style={[styles.errorContainer, errorContainerAnimatedStyle]}>
          <Image source={AssetsPath.ic_history_location_icon} style={styles.errorIcon} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Location Unavailable</Text>
          <Text style={[styles.errorSubtitle, { color: colors.grayTitle }]}>
            No location data available for this reminder.
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          style={styles.fullMap}
          mapStyle={streetsStyle}
          zoomEnabled
          scrollEnabled
          pitchEnabled
          rotateEnabled
        >
          <Camera
            ref={cameraRef}
            centerCoordinate={[
              (notification?.longitude ??
                currentLocation?.coords.longitude ??
                coords.longitude) as number,
              (notification?.latitude ??
                currentLocation?.coords.latitude ??
                coords.latitude) as number,
            ]}
            zoomLevel={16}
            animationDuration={0}
            pitch={45}
            heading={0}
            minZoomLevel={2}
            maxZoomLevel={20}
          />

          {circleGeoJSON && (
            <ShapeSource id="radius-shape" shape={circleGeoJSON}>
              <FillLayer
                id="radius-fill"
                style={{
                  fillColor: colors.primary,
                  fillOpacity: 0.2,
                  fillOutlineColor: colors.primary,
                }}
              />
            </ShapeSource>
          )}

          <PointAnnotation
            id={`notification-location-${notification.id}`}
            coordinate={[coords.longitude as number, coords.latitude as number]}
          >
            <Animated.View style={[styles.modernMarker]}>
              {/* <LinearGradient
                colors={[colors.blue, colors.darkBlue]}
                style={styles.markerCore}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
              </LinearGradient> */}
              <Text style={[styles.markerIcon]}>📍</Text>
            </Animated.View>
          </PointAnnotation>

          {permissionStatus === 'granted' && currentLocation && (
            <PointAnnotation
              id="current-location"
              coordinate={[currentLocation.coords.longitude, currentLocation.coords.latitude]}
            >
              <View style={styles.currentLocationMarker}>
                <View style={styles.currentLocationPulse} />
                <LinearGradient
                  colors={[colors.blue, colors.darkBlue]}
                  style={styles.currentLocationCore}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </View>
            </PointAnnotation>
          )}
        </MapView>

        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent', 'rgba(0,0,0,0.4)']}
          locations={[0, 0.25, 0.75, 1]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      </View>

      <Animated.View style={[styles.modernHeader, headerAnimatedStyle]}>
        <BlurView intensity={80} tint={theme} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <Pressable
              style={styles.headerButton}
              onPress={() => navigationRef.canGoBack() && navigationRef.goBack()}
            >
              <LinearGradient
                colors={
                  theme === 'dark'
                    ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
                    : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)']
                }
                style={styles.headerButtonGradient}
              >
                <Image
                  source={AssetsPath.ic_leftArrow}
                  style={styles.headerIcon}
                  tintColor={colors.text}
                />
              </LinearGradient>
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Location Reminder</Text>
              <Text style={[styles.headerSubtitle, { color: colors.text }]} numberOfLines={2}>
                {notification?.locationName ||
                  (loading ? 'Loading...' : address?.toString().split(',')[0] || 'Unknown')}
              </Text>
            </View>

            <Pressable
              style={styles.headerButton}
              onLongPress={handleMarkedLocationClick}
              onPress={zoomToFitAll}
            >
              <LinearGradient
                colors={
                  theme === 'dark'
                    ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
                    : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)']
                }
                style={styles.headerButtonGradient}
              >
                <Image
                  source={AssetsPath.ic_fullScreen}
                  style={styles.headerIcon}
                  tintColor={colors.text}
                />
              </LinearGradient>
            </Pressable>
          </View>
        </BlurView>
      </Animated.View>

      <BottomSheet
        snapPoints={snapPoints}
        handleIndicatorStyle={{
          backgroundColor: colors.grayTitle,
          width: 50,
          height: 5,
          borderRadius: 3,
        }}
        backgroundStyle={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        style={styles.bottomSheetShadow}
      >
        <BottomSheetScrollView
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Section with Action Buttons */}
          <View
            style={[
              styles.sheetHeader,
              { borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' },
            ]}
          >
            <View style={styles.titleSection}>
              <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={2}>
                {notification.subject || 'Location Reminder'}
              </Text>
              <Text style={[styles.locationLabel, { color: colors.grayTitle }]}>
                {notification.locationName || 'Custom Location'}
              </Text>
            </View>

            {notification.radius && (
              <View style={[styles.radiusBadge, { backgroundColor: colors.background }]}>
                <Text style={[styles.radiusText, { color: colors.text }]}>
                  {notification.radius}m radius
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsContainer}>
            <Pressable style={[styles.actionButton]} onPress={openInGoogleMaps}>
              <View style={[styles.actionButtonGradient, { backgroundColor: colors.background }]}>
                <Text style={styles.actionButtonIcon}>🗺️</Text>
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Open Maps</Text>
              </View>
            </Pressable>

            <Pressable style={[styles.actionButton]} onPress={openNavigation}>
              <View style={[styles.actionButtonGradient, { backgroundColor: colors.background }]}>
                <Text style={styles.actionButtonIcon}>🧭</Text>
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Navigate</Text>
              </View>
            </Pressable>
          </View>

          {currentLocation && estimatedTime && (
            <View style={styles.statsContainer}>
              <Text style={[styles.statsTitle, { color: colors.text }]}>Travel Information</Text>

              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={styles.statIcon}>📏</Text>
                  <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Distance</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {estimatedTime?.distance > 1
                      ? `${estimatedTime?.distance.toFixed(1)} km*`
                      : `${Math.round(estimatedTime?.distance * 1000)} m*`}
                  </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={styles.statIcon}>🚗</Text>
                  <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Driving</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {estimatedTime?.driving < 60
                      ? `${estimatedTime?.driving} min*`
                      : `${Math.floor(estimatedTime?.driving / 60)}h ${estimatedTime?.driving % 60}m*`}
                  </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                  <Text style={styles.statIcon}>🚶</Text>
                  <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Walking</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {estimatedTime?.walking < 60
                      ? `${estimatedTime?.walking} min*`
                      : `${Math.floor(estimatedTime?.walking / 60)}h ${estimatedTime?.walking % 60}m*`}
                  </Text>
                </View>
              </View>

              <Text style={[styles.estimationNote, { color: colors.grayTitle }]}>
                * Estimated times based on straight-line distance (5 km/h walking, 40 km/h driving)
              </Text>
            </View>
          )}

          {/* Message Section */}
          {notification.message && (
            <View style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Message</Text>
              </View>
              <View style={[styles.messageContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.messageText, { color: colors.text }]}>
                  {linkifyText(String(notification.message)).map((part, idx) => {
                    if (part.type === 'url') {
                      return (
                        <Text
                          key={idx}
                          style={[styles.linkText, { color: colors.blue }]}
                          onPress={() => Linking.openURL(part.value)}
                        >
                          {part.value}
                        </Text>
                      );
                    }
                    return <Text key={idx}>{part.value}</Text>;
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Address Section */}
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Address Details</Text>
            </View>
            <View style={[styles.addressContainer, { backgroundColor: colors.background }]}>
              <Text style={[styles.addressText, { color: colors.text }]}>
                {loading ? 'Fetching address...' : address?.toString() || 'Address not available'}
              </Text>
              <View
                style={[
                  styles.coordinatesContainer,
                  {
                    borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  },
                ]}
              >
                <Text style={[styles.coordinatesLabel, { color: colors.grayTitle }]}>
                  Coordinates:
                </Text>
                <Text style={[styles.coordinatesText, { color: colors.text }]}>
                  {coords.latitude?.toString()}, {coords.longitude?.toString()}
                </Text>
              </View>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
};

export default memo(LocationPreview);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  fullMap: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Header Styles
  modernHeader: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerBlur: {
    borderRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  headerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.SemiBold,
    color: '#fff',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },

  // Marker Styles
  modernMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
  },
  markerIcon: {
    fontSize: 22,
  },
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  currentLocationCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Bottom Sheet Styles
  bottomSheetShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 24,
  },
  bottomSheetContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  // Sheet Header
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 20,
    borderBottomWidth: 1,
    // boxShadow: `0 2px 4px rgba(0,0,0,0.2)`,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  reminderTitle: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 6,
  },
  locationLabel: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
  },
  radiusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    boxShadow: `0 2px 2px rgba(0,0,0,0.5)`,
  },
  radiusText: {
    fontSize: 12,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 28,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    boxShadow: `0 2px 4px rgba(0,0,0,0.2)`,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  actionButtonText: {
    fontSize: 14,
    marginTop: 3,
    fontFamily: FONTS.SemiBold,
    color: '#fff',
    textAlign: 'center',
  },

  // Stats Container
  statsContainer: {
    marginBottom: 28,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
    boxShadow: `0 2px 4px rgba(0,0,0,0.2)`,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statIcon: {
    fontSize: 25,
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
    textAlign: 'center',
    marginTop: 3,
  },
  estimationNote: {
    fontSize: 12,
    fontFamily: FONTS.Regular,
    marginTop: 10,
  },

  // Info Sections
  infoSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    boxShadow: `0 2px 4px rgba(0,0,0,0.2)`,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionIconImage: {
    width: 16,
    height: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FONTS.SemiBold,
  },

  // Message Container
  messageContainer: {
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    boxShadow: `0 2px 4px rgba(0,0,0,0.2)`,
  },
  messageText: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
    lineHeight: 22,
  },
  linkText: {
    textDecorationLine: 'underline',
  },

  // Address Container
  addressContainer: {
    padding: 20,
    borderRadius: 16,
    boxShadow: `0 2px 4px rgba(0,0,0,0.2)`,
  },
  addressText: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
    lineHeight: 22,
    marginBottom: 12,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  coordinatesLabel: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    marginRight: 8,
  },
  coordinatesText: {
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
  },

  // Additional Info
  additionalInfo: {
    marginBottom: 16,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCardIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoCardTitle: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
  infoCardContent: {
    paddingLeft: 30,
  },
  infoCardText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    lineHeight: 20,
    marginBottom: 4,
  },

  // Error States
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  errorIcon: {
    width: 40,
    height: 40,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: FONTS.SemiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    lineHeight: 20,
  },
});

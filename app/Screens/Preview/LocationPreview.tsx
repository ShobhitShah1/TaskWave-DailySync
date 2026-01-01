import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useAddressFromCoords } from '@Hooks/useAddressFromCoords';
import { useLiveLocation } from '@Hooks/useLiveLocation';
import useThemeColors from '@Hooks/useThemeMode';
import {
  Camera,
  FillLayer,
  LineLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
  UserLocation,
} from '@maplibre/maplibre-react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { navigationRef } from '@Routes/RootNavigation';
import { fetchRoute } from '@Services/RouteService';
import { Notification } from '@Types/Interface';
import { createGeoJSONCircle } from '@Utils/createGeoJSONCircle';
import { linkifyText } from '@Utils/linkify';
import { fitMapToLocations } from '@Utils/mapBoundsUtils';
import { getMapStyleUrl } from '@Utils/mapStyles';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LocationPreviewRoute = RouteProp<{ params: { notificationData: Notification } }, 'params'>;

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
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

// Animated pulse marker for current location
const PulseMarker = memo(({ color }: { color: string }) => {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.8, { duration: 1500 }), withTiming(1, { duration: 0 })),
      -1,
    );
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 1500 }), withTiming(0.4, { duration: 0 })),
      -1,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.currentLocationMarker}>
      <Animated.View
        style={[styles.currentLocationPulse, { backgroundColor: color }, pulseStyle]}
      />
      <View style={[styles.currentLocationRing, { borderColor: color }]} />
      <View style={[styles.currentLocationDot, { backgroundColor: color }]} />
    </View>
  );
});

// Stat card component
const StatCard = memo(
  ({
    icon,
    value,
    label,
    colors,
    theme,
  }: {
    icon: any;
    value: string;
    label: string;
    colors: any;
    theme: string;
  }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        },
      ]}
    >
      {/* <View
        style={[
          styles.statIconContainer,
          { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
        ]}
      >
        <Image
          source={icon}
          style={[styles.statIcon, { tintColor: colors.text }]}
          resizeMode="contain"
        />
      </View> */}
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.grayTitle }]}>{label}</Text>
    </View>
  ),
);

// Action button component
const ActionButton = memo(
  ({
    label,
    onPress,
    colors,
    theme,
    isPrimary = false,
  }: {
    label: string;
    onPress: () => void;
    colors: any;
    theme: string;
    isPrimary?: boolean;
  }) => (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        isPrimary
          ? { backgroundColor: colors.primary }
          : {
              backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              borderWidth: 1,
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.actionText, { color: isPrimary ? '#FFFFFF' : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  ),
);

const LocationPreview = () => {
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const mapStyleUrl = useMemo(() => getMapStyleUrl(theme), [theme]);
  const { top, bottom } = useSafeAreaInsets();
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
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const cameraRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scaleValue = useSharedValue(1);
  const hasFittedRef = useRef(false);
  const hasRouteFetchedRef = useRef(false);
  const userMovedCameraRef = useRef(false);

  // Initial camera fit - only once when route is ready
  useEffect(() => {
    if (routeGeoJSON && currentLocation && !hasFittedRef.current && !userMovedCameraRef.current) {
      setTimeout(() => {
        zoomToFitAll();
        hasFittedRef.current = true;
      }, 500);
    }
  }, [routeGeoJSON, currentLocation]);

  // Fetch route only once when we first get location
  useEffect(() => {
    if (
      currentLocation &&
      notification?.latitude &&
      notification?.longitude &&
      !hasRouteFetchedRef.current
    ) {
      hasRouteFetchedRef.current = true;

      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        Number(notification?.latitude),
        Number(notification?.longitude),
      );

      const walkingTime = Math.round((distance / 5) * 60);
      const drivingTime = Math.round((distance / 40) * 60);

      setEstimatedTime({
        distance: distance,
        walking: walkingTime,
        driving: drivingTime,
      });

      fetchRoute(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        {
          latitude: Number(notification.latitude),
          longitude: Number(notification.longitude),
        },
      ).then((route) => {
        if (route) {
          setRouteGeoJSON(route);
          if (route.properties) {
            const routeDistanceKm = (route.properties.distance || 0) / 1000;
            const durationSeconds = route.properties.duration || 0;
            setEstimatedTime({
              distance: routeDistanceKm,
              driving: durationSeconds / 60,
              walking: (routeDistanceKm / 5) * 60,
            });
          }
        }
      });
    }
  }, [currentLocation, notification.latitude, notification.longitude]);

  // Update estimated time on location changes (without re-fetching route)
  useEffect(() => {
    if (
      currentLocation &&
      notification?.latitude &&
      notification?.longitude &&
      hasRouteFetchedRef.current
    ) {
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        Number(notification?.latitude),
        Number(notification?.longitude),
      );

      setEstimatedTime((prev) =>
        prev
          ? {
              ...prev,
              distance: distance,
              walking: Math.round((distance / 5) * 60),
            }
          : null,
      );
    }
  }, [currentLocation]);

  const snapPoints = useMemo(() => ['9%', '80%'], []);

  const handleMarkedLocationClick = useCallback(() => {
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 200 });

    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [notification.longitude, notification.latitude],
        animationDuration: 800,
        zoomLevel: 16,
      });
    }
  }, [notification.latitude, notification.longitude, scaleValue]);

  const zoomToFitAll = useCallback(async () => {
    try {
      // Reset user moved flag when user manually clicks fit button
      userMovedCameraRef.current = false;

      if (
        currentLocation?.coords?.longitude &&
        currentLocation?.coords.latitude &&
        notification.longitude &&
        notification.latitude
      ) {
        fitMapToLocations(
          cameraRef,
          {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          {
            latitude: Number(notification.latitude),
            longitude: Number(notification.longitude),
          },
          {
            paddingTop: 100,
            paddingRight: 40,
            paddingBottom: 120,
            paddingLeft: 40,
            animationDuration: 800,
          },
        );
      } else if (notification.latitude && notification.longitude) {
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
  }, [currentLocation, notification, handleMarkedLocationClick]);

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

  const openInGoogleMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${coords.latitude},${coords.longitude}`,
      android: `geo:0,0?q=${coords.latitude},${coords.longitude}`,
    });

    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;

    if (!url) return;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(fallbackUrl);
      }
    });
  };

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

  const formatDistance = (km: number) => {
    if (km >= 1) {
      return `${km.toFixed(1)} km`;
    }
    return `${Math.round(km * 1000)} m`;
  };

  const formatTime = (minutes: number) => {
    const roundedMinutes = Math.round(minutes);
    if (roundedMinutes < 60) {
      return `${roundedMinutes} min`;
    }
    const hours = Math.floor(roundedMinutes / 60);
    const mins = Math.round(roundedMinutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (typeof notification.latitude !== 'number' || typeof notification.longitude !== 'number') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.errorContainer}>
          <View style={[styles.errorIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Image
              source={AssetsPath.ic_history_location_icon}
              style={[styles.errorIcon, { tintColor: colors.primary }]}
            />
          </View>
          <Text style={[styles.errorTitle, { color: colors.text }]}>Location Unavailable</Text>
          <Text style={[styles.errorSubtitle, { color: colors.grayTitle }]}>
            No location data available for this reminder.
          </Text>
          <Pressable
            style={[styles.errorButton, { backgroundColor: colors.primary }]}
            onPress={() => navigationRef.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.fullMap}
          mapStyle={mapStyleUrl}
          zoomEnabled
          scrollEnabled
          pitchEnabled
          rotateEnabled
          onRegionIsChanging={() => {
            // User is manually moving the camera
            userMovedCameraRef.current = true;
          }}
        >
          <Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: [
                (notification?.longitude ?? coords.longitude) as number,
                (notification?.latitude ?? coords.latitude) as number,
              ],
              zoomLevel: 15,
              pitch: 0,
              heading: 0,
            }}
            minZoomLevel={2}
            maxZoomLevel={20}
            animationDuration={0}
          />
          {/* Radius circle overlay */}
          {circleGeoJSON && (
            <ShapeSource id="radius-circle-source" shape={circleGeoJSON}>
              <FillLayer
                id="radius-circle-fill"
                aboveLayerID="background"
                style={{
                  fillColor: colors.text,
                  fillOpacity: 0.12,
                }}
              />
              <LineLayer
                id="radius-circle-border"
                aboveLayerID="radius-circle-fill"
                style={{
                  lineColor: colors.text,
                  lineWidth: 2,
                  lineOpacity: 0.6,
                }}
              />
            </ShapeSource>
          )}
          {/* Route Line */}
          {routeGeoJSON && (
            <ShapeSource id="route-source" shape={routeGeoJSON}>
              <LineLayer
                id="route-line"
                style={{
                  lineColor: '#405DF0',
                  lineWidth: 4,
                  lineCap: 'round',
                  lineJoin: 'round',
                  lineOpacity: 0.8,
                }}
              />
              {/* Inner brighter line for "glow" effect */}
              <LineLayer
                id="route-line-inner"
                style={{
                  lineColor: '#738AFE',
                  lineWidth: 2,
                  lineCap: 'round',
                  lineJoin: 'round',
                  lineOpacity: 1,
                }}
              />
            </ShapeSource>
          )}

          {/* Destination marker */}
          <PointAnnotation
            id={`notification-location-${notification.id}`}
            coordinate={[coords.longitude as number, coords.latitude as number]}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerPin, { backgroundColor: colors.primary }]}>
                <View style={styles.markerPinInner} />
              </View>
              <View style={[styles.markerShadow, { backgroundColor: colors.primary }]} />
            </View>
          </PointAnnotation>
          {/* Current location marker - use UserLocation for stable updates */}
          {permissionStatus === 'granted' && (
            <UserLocation
              visible={true}
              animated={true}
              showsUserHeadingIndicator={false}
              renderMode="normal"
            />
          )}
        </MapView>

        {/* Map gradient overlay */}
        <LinearGradient
          colors={[
            theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
            'transparent',
            'transparent',
            theme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
          ]}
          locations={[0, 0.15, 0.7, 1]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      </View>

      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={[styles.header, { top: top + 10 }]}>
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: theme === 'dark' ? colors.background : '#FFFFFF',
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
            ]}
            onPress={() => navigationRef.canGoBack() && navigationRef.goBack()}
          >
            <Image
              source={AssetsPath.ic_leftArrow}
              style={styles.headerIcon}
              tintColor={colors.text}
            />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {notification?.locationName ||
                (loading ? 'Loading...' : address?.toString().split(',')[0] || 'Location')}
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
            ]}
            onPress={zoomToFitAll}
          >
            <Image
              source={AssetsPath.ic_fullScreen}
              style={styles.headerIcon}
              tintColor={colors.text}
            />
          </Pressable>
        </View>
      </Animated.View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        handleIndicatorStyle={[
          styles.sheetIndicator,
          { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' },
        ]}
        backgroundStyle={[styles.sheetBackground, { backgroundColor: colors.background }]}
        style={styles.bottomSheet}
      >
        <BottomSheetScrollView
          style={styles.sheetScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.sheetContentContainer, { paddingBottom: bottom + 20 }]}
        >
          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.titleSection}>
            <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={2}>
              {notification.subject || 'Location Reminder'}
            </Text>
            <View style={styles.badgeRow}>
              {notification.status === 'sent' && (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: '#22C55E20',
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: '#22C55E' }]}>✓ Delivered</Text>
                </View>
              )}
              {notification.radius && (
                <View
                  style={[
                    styles.radiusBadge,
                    {
                      backgroundColor:
                        theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    },
                  ]}
                >
                  <Text style={[styles.radiusText, { color: colors.text }]}>
                    {notification.radius >= 1000
                      ? `${(notification.radius / 1000).toFixed(1)} km`
                      : `${notification.radius}m`}{' '}
                    radius
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={styles.actionButtonsRow}
          >
            <ActionButton
              label="Open Maps"
              onPress={openInGoogleMaps}
              colors={colors}
              theme={theme}
            />
            <ActionButton label="Navigate" onPress={openNavigation} colors={colors} theme={theme} />
          </Animated.View>

          {/* Stats Section */}
          {currentLocation && estimatedTime && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.statsSection}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Distance & Time</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  icon={AssetsPath.ic_history_location_icon}
                  value={formatDistance(estimatedTime.distance)}
                  label="Distance"
                  colors={colors}
                  theme={theme}
                />
                <StatCard
                  icon={AssetsPath.ic_time}
                  value={formatTime(estimatedTime.driving)}
                  label="Driving"
                  colors={colors}
                  theme={theme}
                />
                <StatCard
                  icon={AssetsPath.ic_history_location_icon}
                  value={formatTime(estimatedTime.walking)}
                  label="Walking"
                  colors={colors}
                  theme={theme}
                />
              </View>
              <Text style={[styles.estimationNote, { color: colors.grayTitle }]}>
                * Estimated based on straight-line distance
              </Text>
            </Animated.View>
          )}

          {/* Message Section */}
          {notification.message && (
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Note</Text>
              <View
                style={[
                  styles.messageCard,
                  {
                    backgroundColor:
                      theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
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
            </Animated.View>
          )}

          {/* Address Section */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Details</Text>
            <View
              style={[
                styles.addressCard,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <View style={styles.addressRow}>
                {/* <View
                  style={[styles.addressIconContainer, { backgroundColor: colors.primary + '15' }]}
                >
                  <Image
                    source={AssetsPath.ic_location_history}
                    style={[styles.addressIcon, { tintColor: colors.text }]}
                    resizeMode="contain"
                  />
                </View> */}
                <View style={styles.addressTextContainer}>
                  <Text style={[styles.addressLabel, { color: colors.text }]}>Address</Text>
                  <Text style={[styles.addressText, { color: colors.text }]}>
                    {loading
                      ? 'Fetching address...'
                      : address?.toString() || 'Address not available'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor:
                      theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              />

              <View style={styles.coordsContainer}>
                <View style={styles.coordItem}>
                  <Text style={[styles.coordLabel, { color: colors.grayTitle }]}>Latitude</Text>
                  <Text style={[styles.coordValue, { color: colors.text }]}>
                    {coords.latitude?.toFixed(6)}
                  </Text>
                </View>
                <View style={styles.coordItem}>
                  <Text style={[styles.coordLabel, { color: colors.grayTitle }]}>Longitude</Text>
                  <Text style={[styles.coordValue, { color: colors.text }]}>
                    {coords.longitude?.toFixed(6)}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
};

export default memo(LocationPreview);

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  // Header
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 50,
    gap: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONTS.SemiBold,
  },

  // Markers
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerPinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  markerShadow: {
    width: 12,
    height: 4,
    borderRadius: 6,
    opacity: 0.3,
    marginTop: 4,
  },
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  currentLocationRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  currentLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },

  // Bottom Sheet
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  sheetScrollView: {
    flex: 1,
  },
  sheetContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Title Section
  titleSection: {
    marginBottom: 20,
    gap: 12,
  },
  reminderTitle: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
    lineHeight: 30,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
  },
  radiusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  radiusText: {
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  actionText: {
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },

  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FONTS.SemiBold,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    width: 22,
    height: 22,
  },
  statValue: {
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
  estimationNote: {
    fontSize: 11,
    fontFamily: FONTS.Regular,
    textAlign: 'center',
    marginTop: 12,
  },

  // Section
  section: {
    marginBottom: 24,
  },

  // Message Card
  messageCard: {
    borderRadius: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    fontFamily: FONTS.Regular,
    lineHeight: 22,
    padding: 16,
  },
  linkText: {
    textDecorationLine: 'underline',
  },

  // Address Card
  addressCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 14,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressIcon: {
    width: 20,
    height: 20,
  },
  addressTextContainer: {
    flex: 1,
    gap: 4,
  },
  addressLabel: {
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  addressText: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  coordsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  coordItem: {
    flex: 1,
    gap: 4,
  },
  coordLabel: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
  coordValue: {
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
  },

  // Error State
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
    maxWidth: 300,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorIcon: {
    width: 40,
    height: 40,
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: FONTS.SemiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 15,
    fontFamily: FONTS.Regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    color: '#FFFFFF',
  },
});

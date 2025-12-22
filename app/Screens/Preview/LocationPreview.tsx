import AssetsPath from '@Constants/AssetsPath';
import streetsStyle from '@Constants/streets-v2-style.json';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useAddressFromCoords } from '@Hooks/useAddressFromCoords';
import { useLiveLocation } from '@Hooks/useLiveLocation';
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
import { Notification } from '@Types/Interface';
import { createGeoJSONCircle } from '@Utils/createGeoJSONCircle';
import { linkifyText } from '@Utils/linkify';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    if (currentLocation && notification?.latitude && notification?.longitude) {
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
    }
  }, [currentLocation, notification.latitude, notification.longitude]);

  const snapPoints = useMemo(() => ['20%', '50%', '85%'], []);

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
          [80, 80, 80, 80],
          800,
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
    scaleValue.value = withSpring(1, { damping: 15, stiffness: 200 });

    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [notification.longitude, notification.latitude],
        animationDuration: 800,
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

  if (typeof notification.latitude !== 'number' || typeof notification.longitude !== 'number') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.errorContainer}>
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
            zoomLevel={15}
            animationDuration={0}
            pitch={0}
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
                  fillOpacity: 0.15,
                  fillOutlineColor: colors.primary,
                }}
              />
            </ShapeSource>
          )}

          <PointAnnotation
            id={`notification-location-${notification.id}`}
            coordinate={[coords.longitude as number, coords.latitude as number]}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerShadow, { backgroundColor: colors.primary }]} />
              <Text style={styles.markerIcon}>📍</Text>
            </View>
          </PointAnnotation>

          {permissionStatus === 'granted' && currentLocation && (
            <PointAnnotation
              id="current-location"
              coordinate={[currentLocation.coords.longitude, currentLocation.coords.latitude]}
            >
              <View style={styles.currentLocationMarker}>
                <View style={[styles.currentLocationRing, { borderColor: colors.blue }]} />
                <View style={[styles.currentLocationDot, { backgroundColor: colors.blue }]} />
              </View>
            </PointAnnotation>
          )}
        </MapView>

        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'transparent', 'transparent', 'rgba(0,0,0,0.2)']}
          locations={[0, 0.2, 0.8, 1]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      </View>

      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <BlurView intensity={theme === 'dark' ? 60 : 80} tint={theme} style={styles.headerBlur}>
          <View style={styles.headerContent}>
            <Pressable
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                },
              ]}
              onPress={() => navigationRef.canGoBack() && navigationRef.goBack()}
            >
              <Image source={AssetsPath.ic_leftArrow} style={styles.icon} tintColor={colors.text} />
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {notification?.locationName ||
                  (loading ? 'Loading...' : address?.toString().split(',')[0] || 'Location')}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.grayTitle }]}>
                Location Reminder
              </Text>
            </View>

            <Pressable
              style={[
                styles.iconButton,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
                },
              ]}
              onPress={zoomToFitAll}
            >
              <Image
                source={AssetsPath.ic_fullScreen}
                style={styles.icon}
                tintColor={colors.text}
              />
            </Pressable>
          </View>
        </BlurView>
      </Animated.View>

      <BottomSheet
        snapPoints={snapPoints}
        handleIndicatorStyle={{
          backgroundColor: colors.grayTitle,
          width: 40,
          height: 4,
        }}
        backgroundStyle={{
          backgroundColor: colors.background,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        style={styles.bottomSheet}
      >
        <BottomSheetScrollView
          style={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sheetHeader}>
            <View style={styles.titleSection}>
              <Text style={[styles.reminderTitle, { color: colors.text }]} numberOfLines={2}>
                {notification.subject || 'Location Reminder'}
              </Text>
              {notification.radius && (
                <View
                  style={[
                    styles.radiusBadge,
                    {
                      backgroundColor:
                        theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <Text style={[styles.radiusText, { color: colors.text }]}>
                    {notification.radius}m radius
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
              ]}
              onPress={openInGoogleMaps}
            >
              <Text style={styles.actionIcon}>🗺️</Text>
              <Text style={[styles.actionText, { color: colors.text }]}>Open Maps</Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                },
              ]}
              onPress={openNavigation}
            >
              <Text style={styles.actionIcon}>🧭</Text>
              <Text style={[styles.actionText, { color: colors.text }]}>Navigate</Text>
            </Pressable>
          </View>

          {currentLocation && estimatedTime && (
            <View style={styles.statsSection}>
              <View style={styles.statsGrid}>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor:
                        theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                  ]}
                >
                  <Text style={styles.statIcon}>📏</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {estimatedTime.distance > 1
                      ? `${estimatedTime.distance.toFixed(1)} km`
                      : `${Math.round(estimatedTime.distance * 1000)} m`}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Distance</Text>
                </View>

                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor:
                        theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                  ]}
                >
                  <Text style={styles.statIcon}>🚗</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {estimatedTime.driving < 60
                      ? `${estimatedTime.driving} min`
                      : `${Math.floor(estimatedTime.driving / 60)}h ${estimatedTime.driving % 60}m`}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Driving</Text>
                </View>

                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor:
                        theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                  ]}
                >
                  <Text style={styles.statIcon}>🚶</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {estimatedTime.walking < 60
                      ? `${estimatedTime.walking} min`
                      : `${Math.floor(estimatedTime.walking / 60)}h ${estimatedTime.walking % 60}m`}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Walking</Text>
                </View>
              </View>

              <Text style={[styles.estimationNote, { color: colors.grayTitle }]}>
                Estimated times based on straight-line distance
              </Text>
            </View>
          )}

          {notification.message && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Message</Text>
              <View
                style={[
                  styles.messageBox,
                  {
                    backgroundColor:
                      theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
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
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Address</Text>
            <View
              style={[
                styles.addressBox,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                },
              ]}
            >
              <Text style={[styles.addressText, { color: colors.text }]}>
                {loading ? 'Fetching address...' : address?.toString() || 'Address not available'}
              </Text>
              <View
                style={[
                  styles.coordsRow,
                  {
                    borderTopColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  },
                ]}
              >
                <Text style={[styles.coordsLabel, { color: colors.grayTitle }]}>Coordinates</Text>
                <Text style={[styles.coordsValue, { color: colors.text }]}>
                  {coords.latitude?.toFixed(6)}, {coords.longitude?.toFixed(6)}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ height: 20 }} />
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

  // Header
  header: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    zIndex: 100,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerBlur: {
    borderRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
    marginTop: 2,
  },

  // Markers
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerShadow: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.3,
    bottom: -2,
  },
  markerIcon: {
    fontSize: 32,
  },
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  currentLocationRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    opacity: 0.3,
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Bottom Sheet
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  bottomSheetContent: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  // Sheet Header
  sheetHeader: {
    marginBottom: 20,
  },
  titleSection: {
    gap: 8,
  },
  reminderTitle: {
    fontSize: 22,
    fontFamily: FONTS.Bold,
    fontWeight: '700',
    lineHeight: 28,
  },
  radiusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  radiusText: {
    fontSize: 11,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
  },

  // Stats
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 15,
    fontFamily: FONTS.Bold,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.Medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  estimationNote: {
    fontSize: 11,
    fontFamily: FONTS.Regular,
    textAlign: 'center',
    opacity: 0.7,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
    marginBottom: 10,
  },
  messageBox: {
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  messageText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    lineHeight: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  addressBox: {
    padding: 16,
    borderRadius: 14,
  },
  addressText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    lineHeight: 20,
    marginBottom: 12,
  },
  coordsRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 4,
  },
  coordsLabel: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
  coordsValue: {
    fontSize: 12,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
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
  },
  errorIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
});

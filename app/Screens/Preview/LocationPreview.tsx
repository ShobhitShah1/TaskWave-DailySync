import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
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
import { SATELLITE_MAP_STYLE } from '@Screens/LocationDetails/Components/LocationMapView/MapStyles';
import { Notification } from '@Types/Interface';
import { createGeoJSONCircle } from '@Utils/createGeoJSONCircle';
import { linkifyText } from '@Utils/linkify';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Linking, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
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

const LocationPreview = () => {
  const { params } = useRoute<LocationPreviewRoute>();
  const notification = params.notificationData;
  const colors = useThemeColors();
  const { theme } = useAppContext();

  const locationOptions = useMemo(
    () => ({
      timeInterval: 10000,
      distanceInterval: 100,
    }),
    [],
  );

  const { location: currentLocation, permissionStatus } = useLiveLocation(locationOptions);

  const [shouldFollowUser, setShouldFollowUser] = useState(true);
  const cameraRef = useRef<any>(null);

  const fadeValue = useSharedValue(0);
  const slideValue = useSharedValue(-100);
  const scaleValue = useSharedValue(0.8);
  const fabPulseValue = useSharedValue(1);
  const markerPulseValue = useSharedValue(1);

  useEffect(() => {
    // Staggered entrance animations with improved timing
    fadeValue.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    slideValue.value = withDelay(
      100,
      withTiming(0, {
        duration: 800,
        easing: Easing.out(Easing.back(1.5)),
      }),
    );

    scaleValue.value = withDelay(
      200,
      withSpring(1, {
        damping: 15,
        stiffness: 150,
        mass: 1,
      }),
    );

    // Start continuous pulse animations
    const startPulseAnimations = () => {
      fabPulseValue.value = withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      );

      markerPulseValue.value = withSequence(
        withTiming(1.2, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      );
    };

    setTimeout(startPulseAnimations, 1000);
  }, []);

  // Continuous pulse animation for FAB
  useEffect(() => {
    const pulseAnimation = () => {
      fabPulseValue.value = withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      );
    };

    const interval = setInterval(pulseAnimation, 6000);
    return () => clearInterval(interval);
  }, []);

  // Continuous pulse animation for marker
  useEffect(() => {
    const markerPulseAnimation = () => {
      markerPulseValue.value = withSequence(
        withTiming(1.15, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      );
    };

    const interval = setInterval(markerPulseAnimation, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (shouldFollowUser && currentLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLocation.coords.longitude, currentLocation.coords.latitude],
        animationDuration: 1200,
      });
    }
  }, [currentLocation, shouldFollowUser]);

  const snapPoints = useMemo(() => ['12%', '45%', '85%'], []);

  const handleCenterUser = () => {
    setShouldFollowUser(true);

    scaleValue.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 10, stiffness: 300 }),
    );

    if (currentLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLocation.coords.longitude, currentLocation.coords.latitude],
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
  const mapStyle = SATELLITE_MAP_STYLE;

  const circleGeoJSON = useMemo(
    () => (notification.radius ? createGeoJSONCircle(coords, notification.radius) : null),
    [coords, notification.radius],
  );

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeValue.value,
      transform: [{ translateY: slideValue.value }],
    };
  });

  const markerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(scaleValue.value * markerPulseValue.value, [0.8, 1.2], [0.8, 1.2]) },
      ],
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
          <Text style={styles.errorIcon}>📍</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={styles.mapContainer}>
        <MapView
          style={styles.fullMap}
          mapStyle={mapStyle}
          zoomEnabled
          scrollEnabled
          pitchEnabled
          rotateEnabled
          onRegionWillChange={() => setShouldFollowUser(false)}
          onRegionDidChange={() => setShouldFollowUser(false)}
        >
          {shouldFollowUser && (
            <Camera
              ref={cameraRef}
              centerCoordinate={[
                (currentLocation?.coords.longitude ?? coords.longitude) as number,
                (currentLocation?.coords.latitude ?? coords.latitude) as number,
              ]}
              zoomLevel={16}
              animationDuration={0}
              pitch={45}
              heading={0}
              minZoomLevel={2}
              maxZoomLevel={20}
            />
          )}

          {circleGeoJSON && (
            <ShapeSource id="radius-shape" shape={circleGeoJSON}>
              <FillLayer
                id="radius-fill"
                style={{
                  fillColor: colors.darkBlue,
                  fillOpacity: 0.4,
                  fillOutlineColor: colors.darkBlue,
                }}
              />
            </ShapeSource>
          )}

          <PointAnnotation
            id="notification-location"
            coordinate={[coords.longitude as number, coords.latitude as number]}
          >
            <Animated.View style={[styles.modernMarker, markerAnimatedStyle]}>
              {/* <LinearGradient
                colors={[colors.blue, colors.darkBlue]}
                style={styles.markerCore}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
              </LinearGradient> */}
              <Text style={[styles.markerIcon, styles.markerCore]}>📍</Text>
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
          colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
          locations={[0, 0.3, 0.7, 1]}
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
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.headerButtonGradient}
              >
                <Image source={AssetsPath.ic_leftArrow} style={styles.headerIcon} />
              </LinearGradient>
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Location Preview</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {loading ? 'Locating...' : address?.toString().split(',')[0] || 'Unknown Location'}
              </Text>
            </View>

            <Pressable style={styles.headerButton} onPress={handleCenterUser}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.headerButtonGradient}
              >
                <Image source={AssetsPath.ic_history_location_icon} style={styles.headerIcon} />
              </LinearGradient>
            </Pressable>
          </View>
        </BlurView>
      </Animated.View>

      <BottomSheet
        snapPoints={snapPoints}
        handleIndicatorStyle={{
          backgroundColor: colors.grayTitle,
          width: 48,
          height: 5,
        }}
        backgroundStyle={{
          backgroundColor: colors.reminderCardBackground,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        style={styles.bottomSheetShadow}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={styles.sheetHeaderContainer}>
            <LinearGradient
              colors={[colors.primary, colors.location]}
              style={styles.sheetHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.sheetHeaderIcon}>🎯</Text>
            </LinearGradient>
            <View style={styles.sheetHeaderTextContainer}>
              <Text style={[styles.sheetHeaderTitle, { color: colors.text }]}>
                Location Details
              </Text>
              <Text style={[styles.sheetHeaderSubtitle, { color: colors.grayTitle }]}>
                {notification.subject || 'Location Reminder'}
              </Text>
            </View>
          </View>

          <View style={styles.quickStatsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.reminderCardBackground }]}>
              <LinearGradient
                colors={[colors.location, colors.locationText]}
                style={styles.statIcon}
              >
                <Text style={styles.statIconText}>📏</Text>
              </LinearGradient>
              <Text style={[styles.statLabel, { color: colors.grayTitle }]}>RADIUS</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {notification.radius ? `${notification.radius}m` : 'N/A'}
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.reminderCardBackground }]}>
              <LinearGradient
                colors={[colors.location, colors.locationText]}
                style={styles.statIcon}
              >
                <Text style={styles.statIconText}>⏰</Text>
              </LinearGradient>
              <Text style={[styles.statLabel, { color: colors.grayTitle }]}>TYPE</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>Geofence</Text>
            </View>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.reminderCardBackground }]}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.location, colors.locationText]}
                style={styles.sectionIcon}
              >
                <Text style={styles.sectionIconText}>💬</Text>
              </LinearGradient>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Message</Text>
            </View>
            <Text style={[styles.sectionContent, { color: colors.grayTitle }]}>
              {linkifyText(String(notification.message)).map((part, idx) => {
                if (part.type === 'url') {
                  return (
                    <Text
                      key={idx}
                      style={{ color: colors.location, textDecorationLine: 'underline' }}
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

          <View style={[styles.sectionCard, { backgroundColor: colors.reminderCardBackground }]}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={[colors.location, colors.locationText]}
                style={styles.sectionIcon}
              >
                <Text style={styles.sectionIconText}>📍</Text>
              </LinearGradient>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Address</Text>
            </View>
            <Text style={[styles.locationName, { color: colors.text }]}>
              {notification.locationName || 'Unnamed Location'}
            </Text>
            <Text style={[styles.sectionContent, { color: colors.grayTitle }]}>
              {loading ? 'Fetching address...' : address?.toString() || 'Address unavailable'}
            </Text>
          </View>
        </BottomSheetView>
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

  modernHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
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
    tintColor: '#fff',
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },

  modernMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  markerPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  markerCore: {
    width: 35,
    height: 35,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: {
    fontSize: 25,
    resizeMode: 'contain',
    textAlign: 'center',
  },
  currentLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  currentLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  currentLocationCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 15,
    zIndex: 100,
  },
  fab: {
    width: 55,
    height: 55,
    borderRadius: 32,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  fabGradient: {
    width: '95%',
    height: '95%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  fabRipple: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  bottomSheetShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  sheetHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sheetHeaderGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sheetHeaderIcon: {
    fontSize: 24,
  },
  sheetHeaderTextContainer: {
    flex: 1,
  },
  sheetHeaderTitle: {
    fontSize: 20,
    fontFamily: FONTS.SemiBold,
    fontWeight: '700',
    marginBottom: 2,
  },
  sheetHeaderSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },

  quickStatsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconText: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FONTS.Medium,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
  },

  sectionCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionIconText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
  },
  sectionContent: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
    lineHeight: 22,
  },
  locationName: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
    marginBottom: 6,
  },

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
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
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

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
import MapMarker from '@Screens/LocationDetails/Components/LocationMapView/MapMarker';
import { SATELLITE_MAP_STYLE } from '@Screens/LocationDetails/Components/LocationMapView/MapStyles';
import { Notification } from '@Types/Interface';
import { createGeoJSONCircle } from '@Utils/createGeoJSONCircle';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

type LocationPreviewRoute = RouteProp<{ params: { notificationData: Notification } }, 'params'>;

const LocationPreview = () => {
  const { params } = useRoute<LocationPreviewRoute>();
  const notification = params.notificationData;
  const colors = useThemeColors();
  const { theme } = useAppContext();

  const { location: currentLocation, permissionStatus } = useLiveLocation({
    timeInterval: 10000,
    distanceInterval: 100,
  });

  const [shouldFollowUser, setShouldFollowUser] = useState(true);
  const cameraRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (shouldFollowUser && currentLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLocation.coords.longitude, currentLocation.coords.latitude],
        animationDuration: 1000,
      });
    }
  }, [currentLocation, shouldFollowUser]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['10%', '40%'], []);

  const handleCenterUser = () => {
    setShouldFollowUser(true);
    if (currentLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [currentLocation.coords.longitude, currentLocation.coords.latitude],
        animationDuration: 800,
      });
    }
  };

  const handleOpenBottomSheet = () => {
    bottomSheetRef.current?.expand();
  };

  if (typeof notification.latitude !== 'number' || typeof notification.longitude !== 'number') {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, fontFamily: FONTS.Medium }}>
          No location data available.
        </Text>
      </View>
    );
  }

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

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
                  fillColor: '#6366F1',
                  fillOpacity: 0.2,
                  fillOutlineColor: '#6366F1',
                }}
              />
            </ShapeSource>
          )}

          <PointAnnotation
            id="notification-location"
            coordinate={[coords.longitude as number, coords.latitude as number]}
          >
            <MapMarker color={colors.blue} backgroundColor={colors.background} />
          </PointAnnotation>

          {permissionStatus === 'granted' && currentLocation && (
            <PointAnnotation
              id="current-location"
              coordinate={[currentLocation.coords.longitude, currentLocation.coords.latitude]}
            >
              <View style={styles.currentLocationMarker}>
                <Image source={AssetsPath.ic_locationGlow} style={styles.currentLocationGlowIcon} />
              </View>
            </PointAnnotation>
          )}
        </MapView>

        <LinearGradient
          colors={[
            theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.3)',
            'transparent',
            theme === 'dark' ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)',
          ]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      </View>

      <View style={styles.modernHeader}>
        <Pressable style={styles.backButton} onPress={() => {}}>
          <View style={[styles.iconButton, { backgroundColor: colors.background }]}>
            <Image
              source={AssetsPath.ic_leftArrow}
              style={{ width: 18, height: 18, tintColor: colors.text, resizeMode: 'contain' }}
            />
          </View>
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Location Preview</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {loading ? 'Loading...' : address?.toString().split(',')[0] || ''}
          </Text>
        </View>
        <Pressable
          style={[styles.iconButton, { backgroundColor: colors.background }]}
          onPress={handleCenterUser}
        >
          <Image
            source={AssetsPath.ic_history_location_icon}
            style={{ width: 20, height: 20, tintColor: colors.text }}
          />
        </Pressable>
      </View>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={handleOpenBottomSheet}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.fabIcon}>ⓘ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: colors.grayTitle }}
        backgroundStyle={{ backgroundColor: colors.reminderCardBackground }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {/* Quick Info Bar */}
          <View style={[styles.quickInfoBar, { backgroundColor: colors.reminderCardBackground }]}>
            <View style={styles.quickInfoItem}>
              <Text style={[styles.quickInfoLabel, { color: colors.grayTitle }]}>TITLE</Text>
              <Text style={[styles.quickInfoValue, { color: colors.text }]} numberOfLines={1}>
                {notification.subject || 'Location Reminder'}
              </Text>
            </View>
            {notification.radius && (
              <View style={styles.quickInfoItem}>
                <Text style={[styles.quickInfoLabel, { color: colors.grayTitle }]}>RADIUS</Text>
                <View style={styles.radiusBadge}>
                  <Text style={styles.radiusBadgeText}>{notification.radius}m</Text>
                </View>
              </View>
            )}
          </View>
          {/* Message Card */}
          <View style={[styles.messageCard, { backgroundColor: colors.reminderCardBackground }]}>
            <View style={styles.messageHeader}>
              <View style={styles.messageIcon}>
                <Text style={styles.messageIconText}>💬</Text>
              </View>
              <Text style={[styles.messageTitle, { color: colors.text }]}>Message</Text>
            </View>
            <Text style={[styles.messageText, { color: colors.grayTitle }]}>
              {notification.message || 'No message provided'}
            </Text>
          </View>
          {/* Location Details */}
          <View style={[styles.locationCard, { backgroundColor: colors.reminderCardBackground }]}>
            <View style={styles.locationHeader}>
              <View style={styles.locationIcon}>
                <Text style={styles.locationIconText}>📍</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationTitle, { color: colors.text }]}>
                  {notification.locationName || 'Unnamed Location'}
                </Text>
                <Text
                  style={[styles.locationAddress, { color: colors.grayTitle }]}
                  numberOfLines={2}
                >
                  {address?.toString() || 'Fetching address...'}
                </Text>
              </View>
            </View>
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
    top: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    zIndex: 100,
  },
  backButton: {
    marginRight: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  backIcon: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  centerIcon: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  markerCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
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
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  currentLocationCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 15,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: height * 0.65,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickInfoBar: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickInfoItem: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 11,
    fontFamily: FONTS.Medium,
    letterSpacing: 1,
    marginBottom: 4,
  },
  quickInfoValue: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
  },
  radiusBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  radiusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
  },
  messageCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  messageIconText: {
    fontSize: 16,
  },
  messageTitle: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 15,
    fontFamily: FONTS.Regular,
    lineHeight: 22,
  },
  locationCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationIconText: {
    fontSize: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  detailIcon: {
    width: 28,
    height: 28,
    marginRight: 14,
    resizeMode: 'contain',
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: FONTS.Medium,
    letterSpacing: 1,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    fontWeight: '600',
  },
  currentLocationGlowIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
});

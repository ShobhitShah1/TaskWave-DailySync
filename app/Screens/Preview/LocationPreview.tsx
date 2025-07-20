import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { useAddressFromCoords } from '@Hooks/useAddressFromCoords';
import useThemeColors from '@Hooks/useThemeMode';
import {
  Camera,
  FillLayer,
  MapView,
  PointAnnotation,
  ShapeSource,
} from '@maplibre/maplibre-react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import HomeHeader from '@Screens/Home/Components/HomeHeader';
import MapMarker from '@Screens/LocationDetails/Components/LocationMapView/MapMarker';
import {
  DARK_MAP_STYLE,
  LIGHT_MAP_STYLE,
} from '@Screens/LocationDetails/Components/LocationMapView/MapStyles';
import { Notification } from '@Types/Interface';
import { createGeoJSONCircle } from '@Utils/createGeoJSONCircle';
import React, { memo, useMemo } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = width * 0.9;
const CARD_RADIUS = 22;
const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.13,
  shadowRadius: 12,
  elevation: 8,
};

type LocationPreviewRoute = RouteProp<{ params: { notificationData: Notification } }, 'params'>;

const LocationPreview = () => {
  const { params } = useRoute<LocationPreviewRoute>();
  const notification = params.notificationData;
  const colors = useThemeColors();
  const { theme } = useAppContext();

  if (typeof notification.latitude !== 'number' || typeof notification.longitude !== 'number') {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.text }}>No location data available.</Text>
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
  const mapStyle = theme === 'light' ? LIGHT_MAP_STYLE : DARK_MAP_STYLE;

  const circleGeoJSON = useMemo(
    () => (notification.radius ? createGeoJSONCircle(coords, notification.radius) : null),
    [coords, notification.radius],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <HomeHeader
        title={'Location Preview'}
        leftIconType="back"
        titleAlignment="center"
        showThemeSwitch={false}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroMapCard, SHADOW]}>
          <MapView
            style={styles.map}
            mapStyle={mapStyle}
            zoomEnabled
            scrollEnabled
            pitchEnabled
            rotateEnabled
          >
            <Camera
              centerCoordinate={[coords.longitude as number, coords.latitude as number]}
              zoomLevel={16}
              animationDuration={0}
              pitch={45}
              heading={0}
              minZoomLevel={2}
              maxZoomLevel={20}
            />
            {/* Draw circle for radius if present */}
            {circleGeoJSON && (
              <ShapeSource id="radius-shape" shape={circleGeoJSON}>
                <FillLayer
                  id="radius-fill"
                  style={{
                    fillColor: colors.blue,
                    fillOpacity: 0.15,
                    fillOutlineColor: colors.blue,
                  }}
                />
              </ShapeSource>
            )}
            <PointAnnotation
              id="notification-location"
              coordinate={[coords.longitude as number, coords.latitude as number]}
            >
              {/* Larger, more visible marker */}
              <View style={styles.markerWrapper}>
                <MapMarker color={colors.blue} backgroundColor={colors.background} />
              </View>
            </PointAnnotation>
          </MapView>
          {/* Address Overlay */}
          <View style={[styles.addressOverlay, { backgroundColor: colors.background + 'ee' }]}>
            <Image
              source={AssetsPath.ic_location_list_icon}
              style={[styles.addressOverlayIcon]}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressOverlayLabel, { color: colors.grayTitle }]}>Address</Text>
              {loading ? (
                <Text style={[styles.addressOverlayText, { color: colors.grayTitle }]}>
                  Loading address...
                </Text>
              ) : (
                <Text style={[styles.addressOverlayText, { color: colors.text }]} numberOfLines={2}>
                  {address?.toString() || 'No address found'}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View
          style={[
            styles.detailsCard,
            SHADOW,
            { backgroundColor: colors.reminderCardBackground, borderColor: colors.borderColor },
          ]}
        >
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeader, { color: colors.grayTitle }]}>Title</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]} numberOfLines={1}>
              {notification.subject || 'Location Reminder'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeader, { color: colors.grayTitle }]}>Message</Text>
            <Text style={[styles.sectionValue, { color: colors.text }]} numberOfLines={2}>
              {notification.message || 'No message'}
            </Text>
          </View>
          {notification.locationName && (
            <>
              <View style={styles.divider} />
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionHeader, { color: colors.grayTitle }]}>Location</Text>
                <View style={styles.chipRow}>
                  <Text
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          theme === 'dark' ? 'rgba(38,107,235,0.18)' : 'rgba(38,107,235,0.10)',
                        color: colors.blue,
                        borderColor: colors.blue,
                      },
                    ]}
                  >
                    {notification.locationName}
                  </Text>
                </View>
              </View>
            </>
          )}
          {notification.radius && (
            <>
              <View style={styles.divider} />
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionHeader, { color: colors.grayTitle }]}>Radius</Text>
                <View style={styles.chipRow}>
                  <Text
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          theme === 'dark' ? 'rgba(76,175,80,0.18)' : 'rgba(76,175,80,0.10)',
                        color: '#4CAF50',
                        borderColor: '#4CAF50',
                      },
                    ]}
                  >
                    {notification.radius} m
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: undefined,
  },
  scrollContent: {
    paddingBottom: 32,
    alignItems: 'center',
    paddingTop: 8,
  },
  heroMapCard: {
    width: width * 0.98,
    height: MAP_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 0,
    marginBottom: 0,
    alignSelf: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(38,107,235,0.13)',
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    backgroundColor: 'rgba(38,107,235,0.08)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#268BEB',
    shadowColor: '#268BEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  addressOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(38,107,235,0.08)',
    gap: 10,
  },
  addressOverlayIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  addressOverlayLabel: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    marginBottom: 2,
  },
  addressOverlayText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.Medium,
  },
  addressOverlayCopyBtn: {
    marginLeft: 10,
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(38,107,235,0.08)',
  },
  copyIcon: {
    width: 20,
    height: 20,
  },
  detailsCard: {
    width: width * 0.94,
    borderRadius: CARD_RADIUS + 6, // less round
    paddingVertical: 18, // less vertical padding
    paddingHorizontal: 14, // less horizontal padding
    marginTop: 16,
    marginBottom: 18,
    alignSelf: 'center',
    backgroundColor: undefined,
    borderWidth: 1,
    gap: 0,
  },
  sectionBlock: {
    marginBottom: 0,
    paddingBottom: 4, // less space
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
    opacity: 0.7,
    letterSpacing: 0.2,
    marginBottom: 1,
    marginLeft: 1,
  },
  sectionValue: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
    fontWeight: '700',
    marginBottom: 1,
    marginLeft: 1,
    marginTop: 1,
  },
  divider: {
    width: '100%',
    height: 0.7,
    backgroundColor: 'rgba(38,107,235,0.08)',
    borderRadius: 1,
    marginVertical: 10,
    alignSelf: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 1,
    marginTop: 3,
  },
  chip: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
    marginRight: 6,
    marginBottom: 1,
    fontWeight: '600',
    letterSpacing: 0.1,
    borderWidth: 1,
  },
  snackbar: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignSelf: 'center',
    marginHorizontal: 32,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 8,
  },
  snackbarText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(LocationPreview);

import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useRef } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import { Notification } from '@Types/Interface';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = width * 0.7;
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
  const mapRef = useRef<MapView>(null);

  if (!notification.latitude || !notification.longitude) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.text }}>No location data available.</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: notification.latitude,
    longitude: notification.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleCenterOnLocation = () => {
    mapRef.current?.animateToRegion(initialRegion, 600);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.previewBackground }]}>
      <View style={[styles.mapCard, SHADOW, { backgroundColor: colors.background }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={true}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
        >
          <Circle
            center={{ latitude: notification.latitude, longitude: notification.longitude }}
            radius={notification.radius || 100}
            fillColor={colors.lightBlue + '22'}
            strokeColor={colors.lightBlue}
            strokeWidth={2}
          />
          <Marker
            coordinate={{ latitude: notification.latitude, longitude: notification.longitude }}
            title={notification.locationName || 'Location'}
            description={notification.message}
          >
            <Image
              source={AssetsPath.ic_locationGlow}
              style={{ width: 38, height: 38 }}
              resizeMode="contain"
            />
          </Marker>
        </MapView>
        <Pressable style={[styles.fab, SHADOW]} onPress={handleCenterOnLocation}>
          <Image source={AssetsPath.ic_view} style={styles.fabIcon} resizeMode="contain" />
        </Pressable>
      </View>
      <View style={styles.divider} />
      <View style={[styles.infoCard, SHADOW, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {notification.subject || 'Location Reminder'}
        </Text>
        <Text style={[styles.message, { color: colors.grayTitle }]} numberOfLines={3}>
          {notification.message}
        </Text>
        {notification.locationName && (
          <View style={styles.locationRow}>
            <Image
              source={AssetsPath.ic_location_list_icon}
              style={styles.locationIcon}
              resizeMode="contain"
            />
            <Text style={[styles.locationName, { color: colors.lightBlue }]} numberOfLines={1}>
              {notification.locationName}
            </Text>
          </View>
        )}
        {notification.radius && (
          <Text style={[styles.radiusText, { color: colors.grayTitle }]}>
            Radius: {notification.radius}m
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mapCard: {
    width: width * 0.94,
    height: MAP_HEIGHT,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    marginTop: 18,
    marginBottom: 0,
    alignSelf: 'center',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    backgroundColor: '#fff',
    borderRadius: 24,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    width: 26,
    height: 26,
    tintColor: '#303334',
  },
  divider: {
    width: width * 0.7,
    height: 2,
    backgroundColor: 'rgba(38,107,235,0.08)',
    borderRadius: 2,
    marginVertical: 18,
    alignSelf: 'center',
  },
  infoCard: {
    width: width * 0.94,
    borderRadius: CARD_RADIUS,
    padding: 22,
    marginBottom: 18,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.SemiBold,
    marginBottom: 8,
  },
  message: {
    fontSize: 16.5,
    fontFamily: FONTS.Medium,
    marginBottom: 12,
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  locationIcon: {
    width: 18,
    height: 18,
    marginRight: 7,
    tintColor: '#268BEB',
  },
  locationName: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    maxWidth: width * 0.7,
  },
  radiusText: {
    fontSize: 14,
    fontFamily: FONTS.Regular,
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LocationPreview;

import LocationSearchBottomSheet from '@Components/LocationSearchBottomSheet';
import { FONTS } from '@Constants/Theme';
import { useLocation } from '@Contexts/LocationProvider';
import BottomSheet from '@gorhom/bottom-sheet';
import { useAddressFromCoords } from '@Hooks/useAddressFromCoords';
import useLocationNotification from '@Hooks/useLocationNotification';
import useDatabase from '@Hooks/useReminder';
import useThemeColors from '@Hooks/useThemeMode';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import HomeHeader from '@Screens/Home/Components/HomeHeader';
import LocationService from '@Services/LocationService';
import {
  GeoLatLng,
  NominatimResult,
  Notification,
  NotificationType,
  LocationReminderStatus,
} from '@Types/Interface';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import LocationMapView from './Components/LocationMapView';
import LocationSearchBar from './Components/LocationSearchBar';
import { SafeAreaView } from 'react-native-safe-area-context';

type ReminderScheduledProps = {
  params: { notificationType: NotificationType; id?: string };
};

const LocationDetails = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ReminderScheduledProps, 'params'>>();
  const id = params?.id as string;
  const notificationType = params?.notificationType as NotificationType;

  const { getNotificationById, updateNotification } = useDatabase();
  const { scheduleLocationNotification } = useLocationNotification();
  const {
    userLocation: cachedLocation,
    isLoading: isLocationProviderLoading,
    refreshLocation,
    permissionStatus,
    requestPermission,
    hasCheckedPermission,
  } = useLocation();

  const bottomSheetRef = useRef<BottomSheet | null>(null);
  const isInitializingRef = useRef(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<GeoLatLng | null>(null);
  const [userLocation, setUserLocation] = useState<GeoLatLng | null>(null);
  const [isSearchPress, setIsSearchPress] = useState(false);

  useEffect(() => {
    if (id) {
      loadExistingNotification();
    }
  }, [id, notificationType]);

  useEffect(() => {
    if (!hasCheckedPermission || isInitializingRef.current || userLocation) return;

    isInitializingRef.current = true;
    initializeLocation();
  }, [hasCheckedPermission, permissionStatus, cachedLocation]);

  const loadExistingNotification = async () => {
    try {
      const response = await getNotificationById(id);
      if (response) {
        setTitle(response?.subject || '');
        setMessage(response?.message || '');
        setAddress(response?.locationName || '');
        setSelectedLocation({
          latitude: Number(response?.latitude),
          longitude: Number(response?.longitude),
        });
        bottomSheetRef?.current?.expand();
      }
    } catch (error) {
      console.error('Error getting existing notification:', error);
    }
  };

  const initializeLocation = async () => {
    setIsFetchingLocation(true);

    if (cachedLocation) {
      setUserLocation(cachedLocation);
      setIsFetchingLocation(false);
      return;
    }

    if (permissionStatus === 'granted') {
      const location = await refreshLocation(false);
      if (location) {
        setUserLocation(location);
      }
      setIsFetchingLocation(false);
      return;
    }

    if (permissionStatus === 'denied' || permissionStatus === null) {
      const status = await requestPermission();
      if (status === 'granted') {
        const location = await refreshLocation(false);
        if (location) {
          setUserLocation(location);
        }
      }
    }

    setIsFetchingLocation(false);
  };

  const { address: fetchedAddress, loading: addressLoading } =
    useAddressFromCoords(selectedLocation);

  useEffect(() => {
    if (fetchedAddress && selectedLocation && !address) {
      setAddress(fetchedAddress);
    }
  }, [fetchedAddress, selectedLocation]);

  // Calculate distance between two points in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const MIN_DISTANCE_METERS = 100;

  const handleLocationSelect = useCallback(
    (coordinate: GeoLatLng) => {
      if (userLocation) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          coordinate.latitude,
          coordinate.longitude,
        );
        if (distance < MIN_DISTANCE_METERS) {
          showMessage({
            message: 'Too Close',
            description: `Select a location at least ${MIN_DISTANCE_METERS}m away from your current position.`,
            type: 'warning',
          });
          return;
        }
      }
      setSelectedLocation(coordinate);
      setAddress('');
      bottomSheetRef?.current?.snapToIndex(1);
    },
    [userLocation],
  );

  const handleSearchResultSelect = useCallback(
    (result: NominatimResult) => {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      if (userLocation) {
        const distance = calculateDistance(userLocation.latitude, userLocation.longitude, lat, lon);
        if (distance < MIN_DISTANCE_METERS) {
          showMessage({
            message: 'Too Close',
            description: `Select a location at least ${MIN_DISTANCE_METERS}m away from your current position.`,
            type: 'warning',
          });
          return;
        }
      }

      setSelectedLocation({ latitude: lat, longitude: lon });
      setAddress(result.display_name || '');
      setTimeout(() => {
        bottomSheetRef?.current?.snapToIndex(1);
      }, 500);
    },
    [userLocation],
  );

  const handleTryAgain = async () => {
    setIsFetchingLocation(true);
    const location = await refreshLocation(false);
    if (location) {
      setUserLocation(location);
    }
    setIsFetchingLocation(false);
  };

  const validateAndSubmit = async () => {
    if (!selectedLocation) {
      Alert.alert('Validation', 'Please select a location on the map.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a title.');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Validation', 'Please enter a message.');
      return;
    }

    setIsLoading(true);

    try {
      const notificationData: Notification = {
        id: id || '',
        type: 'location',
        message: message.trim(),
        date: new Date(),
        subject: title.trim(),
        toContact: [],
        toMail: [],
        attachments: [],
        scheduleFrequency: null,
        days: [],
        memo: [],
        telegramUsername: '',
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        radius: 100,
        locationName: address.trim() || '',
        status: LocationReminderStatus.Pending,
      };

      if (id) {
        const success = await updateNotification(notificationData);
        if (success) {
          LocationService.removeLocationReminder(id);
          LocationService.addLocationReminder({
            id,
            latitude: Number(notificationData.latitude),
            longitude: Number(notificationData.longitude),
            radius: Number(notificationData.radius),
            title: notificationData.subject || '',
            message: notificationData.message || '',
            notification: notificationData,
          });
          showMessage({
            type: 'success',
            message: 'Success',
            description: 'Location-based reminder updated successfully!',
          });
          setTitle('');
          setMessage('');
          setSelectedLocation(null);
          navigation.canGoBack() && navigation.goBack();
        }
      } else {
        const notificationId = await scheduleLocationNotification(notificationData);
        if (notificationId) {
          showMessage({
            type: 'success',
            message: 'Success',
            description: 'Location-based reminder scheduled successfully!',
          });
          setTitle('');
          setMessage('');
          setSelectedLocation(null);
          navigation.canGoBack() && navigation.goBack();
        }
      }
    } catch (error: any) {
      Alert.alert('Error', String(error?.message || error));
    } finally {
      setIsLoading(false);
    }
  };

  const showLoader = !hasCheckedPermission || isFetchingLocation || isLocationProviderLoading;
  const showMap = !showLoader && userLocation;
  const showError = !showLoader && !userLocation;

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader
          title={'Location'}
          titleAlignment="center"
          leftIconType="back"
          showThemeSwitch={false}
        />

        {showLoader && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[styles.loaderText, { color: colors.text }]}>
              Getting your location...
            </Text>
          </View>
        )}

        {showMap && (
          <LocationMapView
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
            userLocation={userLocation}
            title={title}
            setTitle={setTitle}
            message={message}
            setMessage={setMessage}
            validateAndSubmit={validateAndSubmit}
            isLoading={isLoading}
            id={id}
            bottomSheetRef={bottomSheetRef}
            address={address}
            setAddress={setAddress}
          >
            <LocationSearchBar onSearchPress={() => setIsSearchPress(true)} />
          </LocationMapView>
        )}

        {showError && (
          <View style={styles.loaderContainer}>
            <Text style={[styles.loaderText, { color: colors.text }]}>
              Unable to get your location.
            </Text>
            <Pressable
              style={[
                styles.tryAgainButton,
                { backgroundColor: colors.darkBlue, shadowColor: colors.text },
              ]}
              onPress={handleTryAgain}
            >
              <Text style={[styles.tryAgainText, { color: colors.text }]}>Try again</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      <LocationSearchBottomSheet
        isVisible={isSearchPress}
        onClose={() => setIsSearchPress(false)}
        onLocationSelect={(location: NominatimResult) => {
          handleSearchResultSelect(location);
          setIsSearchPress(false);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 8,
    fontSize: 18,
    fontFamily: FONTS.Medium,
  },
  tryAgainButton: {
    width: 170,
    height: 40,
    elevation: 5,
    margin: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  tryAgainText: {
    fontFamily: FONTS.SemiBold,
    fontSize: 14,
  },
});

export default memo(LocationDetails);

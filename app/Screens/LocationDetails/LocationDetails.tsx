import LocationSearchBottomSheet from '@Components/LocationSearchBottomSheet';
import { FONTS } from '@Constants/Theme';
import BottomSheet from '@gorhom/bottom-sheet';
import useLocationNotification from '@Hooks/useLocationNotification';
import useDatabase from '@Hooks/useReminder';
import useThemeColors from '@Hooks/useThemeMode';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import HomeHeader from '@Screens/Home/Components/HomeHeader';
import LocationService from '@Services/LocationService';
import { GeoLatLng, NominatimResult, Notification, NotificationType } from '@Types/Interface';
import React, { memo, useEffect, useRef, useState } from 'react';
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
  const { scheduleLocationNotification, getCurrentLocation } = useLocationNotification();

  const bottomSheetRef = useRef<BottomSheet | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [address, setAddress] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeoLatLng | null>(null);
  const [userLocation, setUserLocation] = useState<GeoLatLng | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [isSearchPress, setIsSearchPress] = useState(false);

  useEffect(() => {
    if (id) {
      getExistingNotificationData();
    }
  }, [id, notificationType]);

  const getExistingNotificationData = async () => {
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

  useEffect(() => {
    fetchUserLocation();
  }, [getCurrentLocation]);

  const fetchUserLocation = async () => {
    setIsLocationLoading(true);

    const location = await getCurrentLocation();

    if (location && location.coords) {
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
    setIsLocationLoading(false);
  };

  const handleLocationSelect = (coordinate: GeoLatLng) => {
    setSelectedLocation(coordinate);
    bottomSheetRef?.current?.snapToIndex(1);
  };

  const handleSearchResultSelect = (result: NominatimResult) => {
    setSelectedLocation({ latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) });
    setAddress(result.display_name || '');
    setTimeout(() => {
      bottomSheetRef?.current?.snapToIndex(1);
    }, 500);
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
        radius: 100, // 100 meters default
        locationName: address.trim() || '',
      };

      if (id) {
        // 1. Update the notification in the database
        const success = await updateNotification(notificationData);
        if (success) {
          // 2. Remove the old reminder from LocationService
          LocationService.removeLocationReminder(id);
          // 3. Add the updated reminder to LocationService
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
          // Reset form and go back
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

  const handleTryAgain = () => {
    fetchUserLocation();
  };

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader
          title={'Location'}
          titleAlignment="center"
          leftIconType="back"
          showThemeSwitch={false}
        />

        {isLocationLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[styles.loaderText, { color: colors.text }]}>
              Getting your location...
            </Text>
          </View>
        ) : userLocation ? (
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
        ) : (
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
        onClose={() => {
          setIsSearchPress(false);
        }}
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
  contentContainer: { flex: 1 },
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
  floatingButton: {
    position: 'absolute',
    right: 5,
    width: 50,
    height: 50,
    borderRadius: 28,
    backgroundColor: 'rgba(64, 93, 240, 1)', // Google Maps blue
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  buttonTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 2,
    // Replace this with your actual icon component
    // Example: <Icon name="my-location" size={24} color="white" />
  },
});

export default memo(LocationDetails);

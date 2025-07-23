import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import useLocationNotification from '@Hooks/useLocationNotification';
import useDatabase from '@Hooks/useReminder';
import useThemeColors from '@Hooks/useThemeMode';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import HomeHeader from '@Screens/Home/Components/HomeHeader';
import { GeoLatLng, NominatimResult, Notification, NotificationType } from '@Types/Interface';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import LocationDetailsCard from './Components/LocationDetailsCard';
import LocationMapView from './Components/LocationMapView';
import LocationSearchBar from './Components/LocationSearchBar';
import LocationService from '@Services/LocationService';
import { FONTS } from '@Constants/Theme';

type ReminderScheduledProps = {
  params: { notificationType: NotificationType; id?: string };
};

const LocationDetails = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<ReminderScheduledProps, 'params'>>();
  const { scheduleLocationNotification, getCurrentLocation } = useLocationNotification();
  const { getNotificationById, updateNotification } = useDatabase();

  const notificationType = useMemo(() => {
    return params?.notificationType as NotificationType;
  }, [params]);

  const id = useMemo(() => {
    return params?.id as NotificationType;
  }, [params]);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeoLatLng | null>(null);
  const [userLocation, setUserLocation] = useState<GeoLatLng | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (id) {
      getExistingNotificationData();
    }
  }, [id, notificationType]);

  const getExistingNotificationData = async () => {
    try {
      const response = await getNotificationById(id);

      if (response) {
        setTitle(response?.message || '');
        setMessage(response?.subject || '');
        setSelectedLocation({
          latitude: Number(response?.latitude),
          longitude: Number(response?.longitude),
        });

        bottomSheetRef?.current?.expand();
      }
    } catch (error) {}
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
    setSearch(result.display_name);
    setSelectedLocation({ latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) });
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
        id: id || '', // Use existing id if updating
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
        locationName: search || '',
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeHeader
        title={'Location'}
        titleAlignment="center"
        leftIconType="back"
        showThemeSwitch={false}
      />

      {isLocationLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loaderText, { color: colors.text }]}>Getting your location...</Text>
        </View>
      ) : userLocation ? (
        <LocationMapView
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          userLocation={userLocation}
        >
          <LocationSearchBar
            value={search}
            onChangeText={setSearch}
            onResultSelect={handleSearchResultSelect}
          />
          <BottomSheet
            handleStyle={{
              borderBottomWidth: 0.5,
              borderColor: colors.reminderCardBackground,
              backgroundColor: colors.reminderCardBackground,
            }}
            handleIndicatorStyle={{ backgroundColor: colors.white }}
            style={{
              borderBottomWidth: 0,
              zIndex: 999999999,
              backgroundColor: colors.reminderCardBackground,
            }}
            snapPoints={['5%', '33%']}
            ref={bottomSheetRef}
            keyboardBlurBehavior="restore"
            keyboardBehavior="interactive"
            android_keyboardInputMode="adjustPan"
          >
            <BottomSheetView
              style={[styles.contentContainer, { backgroundColor: colors.reminderCardBackground }]}
            >
              <LocationDetailsCard
                title={title}
                setTitle={setTitle}
                message={message}
                setMessage={setMessage}
                onCreate={validateAndSubmit}
                isLoading={isLoading}
                isUpdate={!!id}
              />
            </BottomSheetView>
          </BottomSheet>
        </LocationMapView>
      ) : (
        <View style={styles.loaderContainer}>
          <Text style={[styles.loaderText, { color: colors.text }]}>
            Unable to get your location.
          </Text>
        </View>
      )}
    </View>
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
    fontFamily: FONTS.SemiBold,
  },
});

export default memo(LocationDetails);

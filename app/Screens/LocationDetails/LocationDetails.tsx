import useThemeColors from '@hooks/useThemeMode';
import HomeHeader from '@screens/Home/Components/HomeHeader';
import React, { memo, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LatLng } from 'react-native-maps';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import LocationDetailsCard from './Components/LocationDetailsCard';
import LocationMapView from './Components/LocationMapView';
import LocationSearchBar from './Components/LocationSearchBar';

const LocationDetails = () => {
  const colors = useThemeColors();
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const cardAnim = useSharedValue(0);

  useEffect(() => {
    cardAnim.value = withTiming(isSearchFocused ? 0 : 1, { duration: 300 });
  }, [isSearchFocused]);

  const handleLocationSelect = (coordinate: LatLng) => {
    setSelectedLocation(coordinate);
  };

  const validateAndSubmit = () => {
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
    // TODO: Schedule reminder logic here
    Alert.alert('Success', 'Reminder scheduled!');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <HomeHeader
            title={'Location'}
            titleAlignment="center"
            leftIconType="back"
            showThemeSwitch={false}
          />
          <LocationMapView
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
          >
            <LocationSearchBar
              value={search}
              onChangeText={setSearch}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </LocationMapView>
          <LocationDetailsCard
            title={title}
            setTitle={setTitle}
            message={message}
            setMessage={setMessage}
            onCreate={validateAndSubmit}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default memo(LocationDetails);

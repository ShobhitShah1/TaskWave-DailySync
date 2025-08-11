import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import useThemeColors from '@Hooks/useThemeMode';
import { useLocationSearch } from '@Screens/LocationDetails/Components/hooks/useLocationSearch';
import { NominatimResult } from '@Types/Interface';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';

interface LocationSearchBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (location: NominatimResult) => void;
}

// Get location type icon
const getLocationIcon = (displayName: string) => {
  const lower = displayName.toLowerCase();
  if (
    lower.includes('restaurant') ||
    lower.includes('cafe') ||
    lower.includes('food') ||
    lower.includes('dining')
  ) {
    return 'restaurant-outline';
  }
  if (lower.includes('hospital') || lower.includes('clinic') || lower.includes('medical')) {
    return 'medical-outline';
  }
  if (
    lower.includes('school') ||
    lower.includes('university') ||
    lower.includes('college') ||
    lower.includes('education')
  ) {
    return 'school-outline';
  }
  if (lower.includes('park') || lower.includes('garden') || lower.includes('nature')) {
    return 'leaf-outline';
  }
  if (
    lower.includes('mall') ||
    lower.includes('shopping') ||
    lower.includes('store') ||
    lower.includes('market')
  ) {
    return 'storefront-outline';
  }
  if (lower.includes('airport') || lower.includes('airpot') || lower.includes('terminal')) {
    return 'airplane-outline';
  }
  if (
    lower.includes('station') ||
    lower.includes('metro') ||
    lower.includes('bus') ||
    lower.includes('transport')
  ) {
    return 'train-outline';
  }
  if (lower.includes('hotel') || lower.includes('resort') || lower.includes('accommodation')) {
    return 'bed-outline';
  }
  if (lower.includes('bank') || lower.includes('atm') || lower.includes('financial')) {
    return 'card-outline';
  }
  if (lower.includes('gas') || lower.includes('fuel') || lower.includes('petrol')) {
    return 'car-outline';
  }
  return 'location-outline';
};

const LocationSearchBottomSheet: React.FC<LocationSearchBottomSheetProps> = ({
  isVisible,
  onClose,
  onLocationSelect,
}) => {
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const { results, loading } = useLocationSearch({ value: searchQuery });

  const snapPoints = useMemo(() => ['20%', '100%'], []);

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef?.current?.present();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
      bottomSheetRef?.current?.dismiss();
    }
  }, [isVisible, fadeAnim]);

  const handleLocationSelect = useCallback(
    (location: NominatimResult) => {
      onClose();
      onLocationSelect(location);
      setSearchQuery('');
    },
    [onLocationSelect, onClose],
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const renderResultItem = useCallback(
    ({ item, index }: { item: NominatimResult; index: number }) => (
      <Pressable
        key={`${item.lat}-${item.lon}-${index}`}
        onPress={() => handleLocationSelect(item)}
        style={() => [
          styles.resultItem,
          {
            borderBottomColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
        ]}
      >
        <View style={styles.resultContent}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor:
                  theme === 'dark'
                    ? colors.darkPrimaryBackground
                    : colors.scheduleReminderCardBackground,
              },
            ]}
          >
            <Ionicons name={getLocationIcon(item.display_name)} size={18} color={colors.text} />
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[styles.locationText, { color: colors.text, fontFamily: FONTS.Medium }]}
              numberOfLines={1}
            >
              {item.display_name.split(',')[0]}
            </Text>
            <Text
              style={[
                styles.addressText,
                { color: colors.placeholderText, fontFamily: FONTS.Regular },
              ]}
              numberOfLines={2}
            >
              {item.display_name}
            </Text>
          </View>

          <View style={styles.coordinatesContainer}>
            <Text
              style={[
                styles.coordinatesText,
                { color: colors.grayTitle, fontFamily: FONTS.Regular },
              ]}
            >
              {parseFloat(item.lat).toFixed(3)}, {parseFloat(item.lon).toFixed(3)}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.grayTitle}
              style={styles.chevronIcon}
            />
          </View>
        </View>
      </Pressable>
    ),
    [colors, theme, handleLocationSelect],
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <View
          style={[
            styles.emptyIconContainer,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.darkPrimaryBackground
                  : colors.scheduleReminderCardBackground,
            },
          ]}
        >
          <Ionicons
            name={searchQuery ? 'location-outline' : 'search-outline'}
            size={32}
            color={colors.grayTitle}
          />
        </View>
        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.text,
              fontFamily: FONTS.Medium,
            },
          ]}
        >
          {searchQuery ? 'No locations found' : 'Search for places'}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            {
              color: colors.placeholderText,
              fontFamily: FONTS.Regular,
            },
          ]}
        >
          {searchQuery
            ? 'Try adjusting your search terms'
            : 'Find restaurants, landmarks, addresses, and more'}
        </Text>
      </View>
    ),
    [colors, searchQuery, theme],
  );

  const renderLoadingState = useCallback(
    () => (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text
          style={[styles.loadingText, { color: colors.placeholderText, fontFamily: FONTS.Medium }]}
        >
          Searching locations...
        </Text>
      </View>
    ),
    [colors],
  );

  console.log('results', results);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onDismiss={() => {
        onClose();
        clearSearch();
      }}
      index={1}
      // keyboardBehavior="interactive"
      // keyboardBlurBehavior="restore"
      // android_keyboardInputMode="adjustResize"
      onChange={handleSheetChanges}
      backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: colors.background }]}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: colors.grayTitle }]}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: FONTS.SemiBold }]}>
            Search Location
          </Text>
          <Pressable
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                backgroundColor:
                  theme === 'dark'
                    ? colors.darkPrimaryBackground
                    : colors.scheduleReminderCardBackground,
              },
            ]}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                theme === 'dark'
                  ? colors.darkPrimaryBackground
                  : colors.scheduleReminderCardBackground,
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.grayTitle} style={styles.searchIcon} />
          <BottomSheetTextInput
            style={[styles.searchInput, { color: colors.text, fontFamily: FONTS.Regular }]}
            placeholder="Search for a location..."
            placeholderTextColor={colors.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={colors.grayTitle} />
            </Pressable>
          )}
        </View>

        <View style={styles.resultsContainer}>
          {loading ? (
            renderLoadingState()
          ) : (
            <BottomSheetFlatList
              data={results}
              renderItem={renderResultItem}
              keyExtractor={(item, index) => `${item.lat}-${item.lon}-${index}`}
              style={styles.resultsList}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </Animated.View>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  bottomSheetBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  container: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 20,
    borderWidth: 1,
    height: 52,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 8,
  },
  clearButton: {},
  resultsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  resultsList: {
    flex: 1,
  },
  resultsContent: {
    flexGrow: 1,
  },
  resultItem: {
    borderRadius: 12,
    borderBottomWidth: 0.5,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 18,
  },
  coordinatesContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  chevronIcon: {
    marginTop: 2,
  },
  separator: {
    height: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 5,
  },
});

export default memo(LocationSearchBottomSheet);

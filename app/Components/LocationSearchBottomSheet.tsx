import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useLocationSearch } from '@Hooks/useLocationSearch';
import useThemeColors from '@Hooks/useThemeMode';
import { NominatimResult } from '@Types/Interface';
import {
  getLocationIconName,
  formatCoordinates,
  getLocationName,
} from '@Utils/locationSearchUtils';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface LocationSearchBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (location: NominatimResult) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LocationSearchBottomSheet: React.FC<LocationSearchBottomSheetProps> = ({
  isVisible,
  onClose,
  onLocationSelect,
}) => {
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const opacity = useSharedValue(0);

  const [searchQuery, setSearchQuery] = useState('');
  const { results, loading } = useLocationSearch({ value: searchQuery });

  const snapPoints = useMemo(() => ['20%', '100%'], []);
  const isDark = theme === 'dark';

  const containerBg = isDark ? colors.darkPrimaryBackground : colors.scheduleReminderCardBackground;
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.present();
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = 0;
      bottomSheetRef.current?.dismiss();
    }
  }, [isVisible, opacity]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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
      if (index === -1) onClose();
    },
    [onClose],
  );

  const clearSearch = useCallback(() => setSearchQuery(''), []);

  const handleDismiss = useCallback(() => {
    onClose();
    clearSearch();
  }, [onClose, clearSearch]);

  const renderResultItem = useCallback(
    ({ item, index }: { item: NominatimResult; index: number }) => (
      <AnimatedPressable
        key={`${item.lat}-${item.lon}-${index}`}
        onPress={() => handleLocationSelect(item)}
        entering={FadeIn.delay(index * 50).duration(200)}
        style={[styles.resultItem, { borderBottomColor: borderColor }]}
      >
        <View style={styles.resultContent}>
          <View style={[styles.iconContainer, { backgroundColor: containerBg }]}>
            <Ionicons
              name={getLocationIconName(item.display_name) as any}
              size={18}
              color={colors.text}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
              {getLocationName(item.display_name)}
            </Text>
            <Text style={[styles.addressText, { color: colors.placeholderText }]} numberOfLines={2}>
              {item.display_name}
            </Text>
          </View>

          <View style={styles.coordinatesContainer}>
            <Text style={[styles.coordinatesText, { color: colors.grayTitle }]}>
              {formatCoordinates(item.lat, item.lon)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.grayTitle} />
          </View>
        </View>
      </AnimatedPressable>
    ),
    [colors, containerBg, borderColor, handleLocationSelect],
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconContainer, { backgroundColor: containerBg }]}>
          <Ionicons
            name={searchQuery ? 'location-outline' : 'search-outline'}
            size={32}
            color={colors.grayTitle}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {searchQuery ? 'No locations found' : 'Search for places'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.placeholderText }]}>
          {searchQuery
            ? 'Try adjusting your search terms'
            : 'Find restaurants, landmarks, addresses, and more'}
        </Text>
      </View>
    ),
    [colors, searchQuery, containerBg],
  );

  const renderLoadingState = useCallback(
    () => (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={[styles.loadingText, { color: colors.placeholderText }]}>
          Searching locations...
        </Text>
      </View>
    ),
    [colors],
  );

  const showClearButton = searchQuery.length > 0 && !loading;
  const showInlineLoader = results.length > 0 && loading;
  const showFullLoader = loading && results.length === 0;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
      index={1}
      onChange={handleSheetChanges}
      backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: colors.background }]}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Search Location</Text>
          <Pressable
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: containerBg }]}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: containerBg, borderColor }]}>
          <Ionicons name="search" size={20} color={colors.grayTitle} style={styles.searchIcon} />
          <BottomSheetTextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search for a location..."
            placeholderTextColor={colors.placeholderText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            returnKeyType="search"
          />
          {showInlineLoader && <ActivityIndicator color={colors.text} />}
          {showClearButton && (
            <Pressable onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.grayTitle} />
            </Pressable>
          )}
        </View>

        <View style={styles.resultsContainer}>
          {showFullLoader ? (
            renderLoadingState()
          ) : (
            <BottomSheetFlatList
              data={results}
              enableFooterMarginAdjustment
              renderItem={renderResultItem}
              keyExtractor={(item: NominatimResult, index: number) =>
                `${item.lat}-${item.lon}-${index}`
              }
              style={styles.resultsList}
              contentContainerStyle={styles.resultsContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              keyboardShouldPersistTaps="handled"
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
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  handleIndicator: {
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
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
    fontFamily: FONTS.SemiBold,
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
    fontFamily: FONTS.Medium,
  },
  resultsContainer: {
    flex: 1,
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
    fontFamily: FONTS.Medium,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: FONTS.Medium,
  },
  coordinatesContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  coordinatesText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
    fontFamily: FONTS.Medium,
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
    fontFamily: FONTS.Medium,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: FONTS.Regular,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 5,
    fontFamily: FONTS.Medium,
  },
});

export default memo(LocationSearchBottomSheet);

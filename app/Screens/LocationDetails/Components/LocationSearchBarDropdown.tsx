import useThemeColors from '@Hooks/useThemeMode';
import { NominatimResult } from '@Types/Interface';
import React from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

interface LocationSearchBarDropdownProps {
  show: boolean;
  loading: boolean;
  results: NominatimResult[];
  onSelect: (item: NominatimResult) => void;
  animStyle: any;
}

const LocationSearchBarDropdown: React.FC<LocationSearchBarDropdownProps> = ({
  show,
  loading,
  results,
  onSelect,
  animStyle,
}) => {
  const colors = useThemeColors();
  if (!show) return null;
  return (
    <Animated.View
      style={[
        styles.resultsContainer,
        animStyle,
        {
          backgroundColor: colors.background,
          shadowColor: colors.black,
          borderColor: colors.borderColor,
        },
      ]}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.blue} style={{ marginRight: 8 }} />
          <Text style={[styles.loadingText, { color: colors.grayTitle }]}>Searching...</Text>
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          nestedScrollEnabled
          overScrollMode="always"
          keyExtractor={(item, idx) => item.lat + item.lon + idx}
          renderItem={({ item }) => (
            <Pressable style={styles.resultItem} onPress={() => onSelect(item)}>
              <Text style={[styles.resultText, { color: colors.text }]} numberOfLines={2}>
                {item.display_name}
              </Text>
            </Pressable>
          )}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <View style={styles.loadingRow}>
          <Text style={[styles.loadingText, { color: colors.grayTitle }]}>No results found</Text>
        </View>
      )}
    </Animated.View>
  );
};

export default LocationSearchBarDropdown;

const styles = StyleSheet.create({
  resultsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 20,
    maxHeight: 260,
    overflow: 'hidden',
    borderWidth: 1,
  },
  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'transparent',
  },
  resultText: {
    fontSize: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

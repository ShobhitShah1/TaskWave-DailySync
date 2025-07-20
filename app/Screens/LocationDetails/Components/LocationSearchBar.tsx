import { useAppContext } from '@Contexts/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
} from 'react-native';

import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';

interface LocationSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onResultSelect?: (result: NominatimResult) => void;
}

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  onResultSelect,
}) => {
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dropdownAnim] = useState(new Animated.Value(0));

  const fetchNominatim = async (query: string): Promise<NominatimResult[]> => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Nominatim blocked or returned non-JSON');
    }
  };

  const fetchPhoton = async (query: string): Promise<NominatimResult[]> => {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    // Map Photon results to Nominatim-like format
    return (data.features || []).map((f: any) => ({
      display_name: [f.properties.name, f.properties.city, f.properties.country]
        .filter(Boolean)
        .join(', '),
      lat: f.geometry.coordinates[1].toString(),
      lon: f.geometry.coordinates[0].toString(),
    }));
  };

  useEffect(() => {
    if (value.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      (async () => {
        try {
          let data = await fetchNominatim(value);
          setResults(data);
          setShowResults(true);
        } catch (e) {
          // fallback to Photon
          try {
            let data = await fetchPhoton(value);
            setResults(data);
            setShowResults(true);
          } catch (err) {
            setResults([]);
            setShowResults(false);
          }
        } finally {
          setLoading(false);
        }
      })();
    }, 1200);
    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    if (showResults && (results.length > 0 || loading)) {
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [showResults, results.length, loading]);

  const handleSelect = (item: NominatimResult) => {
    setShowResults(false);
    onResultSelect && onResultSelect(item);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.white, shadowColor: colors.black }]}>
      <Ionicons
        name="search"
        size={18}
        color={theme !== 'dark' ? colors.white : colors.black}
        style={styles.icon}
      />
      <TextInput
        style={[
          styles.input,
          { color: theme !== 'dark' ? colors.white : colors.black, fontFamily: FONTS.Medium },
        ]}
        placeholder="Search Here"
        placeholderTextColor={theme !== 'dark' ? colors.white : colors.black}
        autoCorrect={false}
        underlineColorAndroid="transparent"
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {loading && <ActivityIndicator size="small" color={colors.blue} style={{ marginLeft: 8 }} />}
      {showResults && (results.length > 0 || loading || (!loading && value.length >= 3)) && (
        <Animated.View
          style={[
            styles.resultsContainer,
            {
              backgroundColor: colors.background,
              shadowColor: colors.black,
              opacity: dropdownAnim,
              transform: [
                {
                  scaleY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }),
                },
              ],
              borderWidth: 1,
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
                <Pressable style={styles.resultItem} onPress={() => handleSelect(item)}>
                  <Text style={[styles.resultText, { color: colors.text }]} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </Pressable>
              )}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.loadingRow}>
              <Text style={[styles.loadingText, { color: colors.grayTitle }]}>
                No results found
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '78%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 15,
    margin: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
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
  poweredByRow: {
    alignItems: 'flex-end',
    paddingVertical: 6,
    paddingRight: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'transparent',
  },
  poweredByText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default LocationSearchBar;

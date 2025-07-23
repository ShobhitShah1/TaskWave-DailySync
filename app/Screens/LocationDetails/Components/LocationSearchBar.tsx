import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import useThemeColors from '@Hooks/useThemeMode';
import { LocationSearchBarProps } from '@Types/Interface';
import React from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { useLocationSearch } from './hooks/useLocationSearch';
import LocationSearchBarDropdown from './LocationSearchBarDropdown';

const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  onResultSelect,
}) => {
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const { results, loading, showResults, dropdownAnimStyle, handleSelect } = useLocationSearch({
    value,
    onResultSelect,
  });

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
      <LocationSearchBarDropdown
        show={showResults}
        loading={loading}
        results={results}
        onSelect={(item) => {
          handleSelect(item);
          onChangeText('');
        }}
        animStyle={dropdownAnimStyle}
      />
    </View>
  );
};

export default LocationSearchBar;

const styles = StyleSheet.create({
  container: {
    width: '78%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 15,
    marginHorizontal: 16,
    marginTop: 13,
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
});

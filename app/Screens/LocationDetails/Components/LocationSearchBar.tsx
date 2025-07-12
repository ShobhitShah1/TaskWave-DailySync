import { useAppContext } from '@contexts/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { FONTS } from '../../../Constants/Theme';
import useThemeColors from '../../../Hooks/useThemeMode';

interface LocationSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
}) => {
  const { theme } = useAppContext();
  const colors = useThemeColors();
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
});

export default LocationSearchBar;

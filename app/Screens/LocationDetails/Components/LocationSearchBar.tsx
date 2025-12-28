import { ColorGroups, FONTS } from '@Constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import useThemeColors from '@Hooks/useThemeMode';
import { LocationSearchBarProps } from '@Types/Interface';
import React, { memo } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

const LocationSearchBar: React.FC<LocationSearchBarProps> = ({ onSearchPress }) => {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onSearchPress}
      style={[styles.container, { backgroundColor: colors.white, shadowColor: colors.black }]}
    >
      <Ionicons name="search" size={18} color={ColorGroups.gray.dark} style={styles.icon} />
      <TextInput
        editable={false}
        style={[styles.input, { color: ColorGroups.gray.dark, fontFamily: FONTS.Medium }]}
        placeholder="Search Here"
        placeholderTextColor={ColorGroups.gray.dark}
        value={''}
      />
    </Pressable>
  );
};

export default memo(LocationSearchBar);

const styles = StyleSheet.create({
  container: {
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 15,
    marginTop: 13,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'absolute',
    top: 0,
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

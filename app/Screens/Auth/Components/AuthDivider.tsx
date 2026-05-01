import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AuthDividerProps {
  label: string;
}

const AuthDivider = ({ label }: AuthDividerProps) => {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      <View style={[styles.line, { backgroundColor: colors.borderColor }]} />
      <Text style={[styles.label, { color: colors.grayTitle }]}>{label}</Text>
      <View style={[styles.line, { backgroundColor: colors.borderColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
  },
});

export default AuthDivider;

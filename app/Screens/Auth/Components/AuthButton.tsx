import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
}

const AuthButton = ({ title, onPress, loading }: AuthButtonProps) => {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.darkBlue,
          opacity: pressed || loading ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={[styles.label, { color: colors.white }]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontFamily: FONTS.SemiBold,
    fontSize: 17,
  },
});

export default AuthButton;

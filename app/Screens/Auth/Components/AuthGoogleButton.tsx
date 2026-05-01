import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface AuthGoogleButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
}

const AuthGoogleButton = ({ title, onPress, loading }: AuthGoogleButtonProps) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const surfaceColor = theme === 'dark' ? colors.darkPrimaryBackground : colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: surfaceColor,
          borderColor: colors.borderColor,
          opacity: pressed || loading ? 0.9 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.darkBlue} />
      ) : (
        <View style={styles.content}>
          <View style={[styles.badge, { backgroundColor: 'rgba(64, 93, 240, 0.12)' }]}>
            <Text style={[styles.badgeText, { color: colors.darkBlue }]}>G</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 20,
    fontFamily: FONTS.Bold,
  },
  title: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
});

export default AuthGoogleButton;

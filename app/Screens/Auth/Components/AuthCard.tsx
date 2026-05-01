import useThemeColors from '@Hooks/useThemeMode';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const AuthCard: React.FC<React.PropsWithChildren> = ({ children }) => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor:
            colors.background === colors.white
              ? 'rgba(245, 247, 255, 1)'
              : colors.darkPrimaryBackground,
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
});

export default AuthCard;

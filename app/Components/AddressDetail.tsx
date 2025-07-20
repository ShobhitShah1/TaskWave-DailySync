import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import useThemeColors from '@Hooks/useThemeMode';
import AssetsPath from '@Constants/AssetsPath';
import { Image } from 'react-native';

interface AddressDetailProps {
  address: string;
  loading: boolean;
  style?: ViewStyle;
}

const AddressDetail: React.FC<AddressDetailProps> = ({ address, loading, style }) => {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderColor: colors.blue },
        style,
      ]}
    >
      <View style={styles.arrow} />
      <View style={styles.content}>
        <Image
          source={AssetsPath.ic_locationGlow}
          style={[styles.icon, { tintColor: colors.blue }]}
        />
        {loading ? (
          <ActivityIndicator size="small" color={colors.blue} style={{ marginLeft: 8 }} />
        ) : (
          <Text
            style={[styles.text, { color: colors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {address}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 140,
    maxWidth: 260,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'absolute',
    bottom: 54,
    left: '50%',
    transform: [{ translateX: -130 }],
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  arrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 8,
    backgroundColor: 'transparent',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    zIndex: 11,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 8,
    resizeMode: 'contain',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    flex: 1,
  },
});

export default AddressDetail;

import { useAppContext } from '@Contexts/ThemeProvider';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

interface LocationDetailsCardProps {
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  onCreate: () => void;
  isLoading?: boolean;
  isUpdate?: boolean;
  address: string;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  routeStats?: { distance: number; duration: number } | null;
}

const LocationDetailsCard: React.FC<LocationDetailsCardProps> = ({
  title,
  setTitle,
  message,
  setMessage,
  onCreate,
  isLoading = false,
  isUpdate,
  address,
  setAddress,
  routeStats,
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]} pointerEvents="box-none">
      {routeStats && (
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statItem,
              { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
            ]}
          >
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Est. Time</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {Math.round(routeStats.duration)} min
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statItem,
              { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
            ]}
          >
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.grayTitle }]}>Distance</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {routeStats.distance.toFixed(1)} km
              </Text>
            </View>
          </View>
        </View>
      )}

      <BottomSheetTextInput
        style={[
          styles.titleInput,
          {
            backgroundColor: theme === 'dark' ? 'rgba(63, 65, 69, 1)' : 'rgba(241, 241, 240, 1)',
            color: colors.text,
          },
        ]}
        placeholder="Address"
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        placeholderTextColor={colors.placeholderText}
        value={address}
        onChangeText={setAddress}
      />
      <BottomSheetTextInput
        style={[
          styles.titleInput,
          {
            backgroundColor: theme === 'dark' ? 'rgba(63, 65, 69, 1)' : 'rgba(241, 241, 240, 1)',
            color: colors.text,
          },
        ]}
        placeholder="Title"
        placeholderTextColor={colors.placeholderText}
        value={title}
        onChangeText={setTitle}
      />
      <BottomSheetTextInput
        style={[
          styles.messageInput,
          {
            backgroundColor: theme === 'dark' ? 'rgba(63, 65, 69, 1)' : 'rgba(241, 241, 240, 1)',
            color: colors.text,
          },
        ]}
        placeholder="Message..."
        placeholderTextColor={colors.placeholderText}
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
      />

      <Pressable
        style={[
          styles.button,
          { backgroundColor: theme === 'dark' ? colors.white : colors.black },
          isLoading && { opacity: 0.6 },
        ]}
        onPress={onCreate}
        disabled={isLoading}
      >
        <Text
          style={[
            styles.buttonText,
            { color: theme !== 'dark' ? colors.white : colors.black, fontFamily: FONTS.SemiBold },
          ]}
        >
          {isLoading ? (isUpdate ? 'Updating...' : 'Creating...') : isUpdate ? 'Update' : 'Create'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 16,
  },
  titleInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  messageInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: FONTS.Medium,
  },
  button: {
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  statItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  statTextContainer: {
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
    fontFamily: FONTS.Bold,
  },
});

export default LocationDetailsCard;

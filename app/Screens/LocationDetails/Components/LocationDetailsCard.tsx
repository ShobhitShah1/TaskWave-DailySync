import { useAppContext } from '@Contexts/ThemeProvider';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  return (
    <View
      style={[styles.card, { backgroundColor: colors.background, shadowColor: colors.black }]}
      pointerEvents="box-none"
    >
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
    paddingHorizontal: 16,
    paddingTop: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  titleInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
    marginBottom: 8,
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  messageInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: FONTS.Medium,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
  },
});

export default LocationDetailsCard;

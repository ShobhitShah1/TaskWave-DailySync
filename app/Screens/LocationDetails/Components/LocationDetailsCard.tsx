import { useAppContext } from '@Contexts/ThemeProvider';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';

interface LocationDetailsCardProps {
  title: string;
  setTitle: (t: string) => void;
  message: string;
  setMessage: (m: string) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

const LocationDetailsCard: React.FC<LocationDetailsCardProps> = ({
  title,
  setTitle,
  message,
  setMessage,
  onCreate,
  isLoading = false,
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.reminderCardBackground, shadowColor: colors.black },
      ]}
    >
      <TextInput
        style={[
          styles.titleInput,
          { backgroundColor: colors.background, color: colors.text, fontFamily: FONTS.Medium },
        ]}
        placeholder="Title"
        placeholderTextColor={colors.placeholderText}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[
          styles.messageInput,
          { backgroundColor: colors.background, color: colors.text, fontFamily: FONTS.Regular },
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
          {isLoading ? 'Creating...' : 'Create'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  titleInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
    marginBottom: 8,
    fontSize: 15,
  },
  messageInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
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

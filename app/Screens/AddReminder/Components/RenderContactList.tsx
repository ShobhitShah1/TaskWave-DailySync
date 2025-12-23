import React, { memo, useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';
import { Contact } from '@Types/Interface';
import styles from '../styles';

interface RenderContactListProps {
  contacts: Contact;
  selectedContacts: Contact[];
  handleSelectContact: (contactId: Contact) => void;
}

const RenderContactList: React.FC<RenderContactListProps> = ({
  contacts,
  selectedContacts,
  handleSelectContact,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const { theme } = useAppContext();

  const isSelected = selectedContacts.some((contact) => contact.recordID === contacts.recordID);

  const animatedStyle = useAnimatedStyle(
    () => ({
      backgroundColor: withTiming(isSelected ? 'rgba(1, 133, 226, 1)' : colors.contactBackground, {
        duration: 300,
      }),
    }),
    [isSelected, colors.reminderCardBackground],
  );

  const textColor = useMemo(
    () =>
      isSelected ? '#FFFFFF' : theme === 'light' ? colors.lightContact : colors.placeholderText,
    [isSelected],
  );

  return (
    <Animated.View style={[style.contactItemContainer, animatedStyle]}>
      <Pressable
        onPress={() => handleSelectContact(contacts)}
        style={{ flexDirection: 'row', padding: 15 }}
      >
        {contacts?.thumbnailPath && (
          <Image source={{ uri: contacts?.thumbnailPath }} style={style.contactAvatar} />
        )}
        <View>
          <Text style={[style.contactName, { color: textColor }]}>{contacts.name}</Text>
          <Text style={[style.contactNumber, { color: textColor }]}>{contacts.number}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default memo(RenderContactList);

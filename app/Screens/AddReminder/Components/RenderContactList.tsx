import { Image, Pressable, Text, View } from "react-native";
import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import styles from "../styles";
import useThemeColors from "../../../Theme/useThemeMode";
import { SimplifiedContact } from "../../../Types/Interface";

interface RenderContactListProps {
  contacts: SimplifiedContact;
  selectedContacts: string[];
  handleSelectContact: (contactId: string) => void;
}

const RenderContactList: React.FC<RenderContactListProps> = ({
  contacts,
  selectedContacts,
  handleSelectContact,
}) => {
  const style = styles();
  const colors = useThemeColors();

  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const isSelected = selectedContacts.includes(contacts.recordID);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const backgroundColor = useSharedValue(
    isSelected ? "rgba(1, 133, 226, 1)" : colors.reminderCardBackground
  );

  useEffect(() => {
    backgroundColor.value = withTiming(
      isSelected ? "rgba(1, 133, 226, 1)" : colors.reminderCardBackground,
      { duration: 500 }
    );
  }, [isSelected, backgroundColor]);

  const colorStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  const textColor = isSelected ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)";

  return (
    <Animated.View
      style={[style.contactItemContainer, animatedStyle, colorStyle]}
    >
      <Pressable
        onPress={() => handleSelectContact(contacts.recordID)}
        style={{ flexDirection: "row", padding: 15 }}
      >
        {contacts.thumbnailPath && (
          <Image
            source={{ uri: contacts.thumbnailPath }}
            style={style.contactAvatar}
          />
        )}
        <View>
          <Text style={[style.contactName, { color: textColor }]}>
            {contacts.displayName}
          </Text>
          <Text style={[style.contactNumber, { color: textColor }]}>
            {contacts.phoneNumbers[0]?.number}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default RenderContactList;

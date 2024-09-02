import { Image, Pressable, Text, View } from "react-native";
import React, { useEffect, useMemo } from "react";
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import styles from "../styles";
import useThemeColors from "../../../Theme/useThemeMode";
import { SimplifiedContact } from "../../../Types/Interface";
import { useAppContext } from "../../../Contexts/ThemeProvider";

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
  const { theme } = useAppContext();

  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const isSelected = selectedContacts.includes(contacts.recordID);

  useEffect(() => {
    runOnUI(() => {
      scale.value = withSpring(1, { damping: 20, stiffness: 500 });
      opacity.value = withTiming(1, { duration: 500 });
    })();
  }, []);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      backgroundColor: withTiming(
        isSelected ? "rgba(1, 133, 226, 1)" : colors.contactBackground,
        { duration: 500 }
      ),
    }),
    [isSelected, colors.reminderCardBackground]
  );

  const textColor = useMemo(
    () =>
      isSelected
        ? "#FFFFFF"
        : theme === "light"
          ? colors.lightContact
          : colors.placeholderText,
    [isSelected]
  );

  return (
    <Animated.View style={[style.contactItemContainer, animatedStyle]}>
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

import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import styles from "../styles";
import useThemeColors from "../../../Theme/useThemeMode";

const RenderContactList = ({
  selectedContact,
  contacts,
  handleSelectContact,
}) => {
  const style = styles();
  const colors = useThemeColors();

  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const isSelected = selectedContact === contacts.recordID;
  const backgroundColor = useSharedValue(
    isSelected ? "rgba(0, 0, 255, 0.2)" : colors.reminderCardBackground
  );

  useEffect(() => {
    backgroundColor.value = withTiming(
      isSelected ? "rgba(0, 0, 255, 0.2)" : colors.reminderCardBackground,
      { duration: 500 }
    );
  }, [isSelected, backgroundColor]);

  const colorStyle = useAnimatedStyle(() => ({
    backgroundColor: backgroundColor.value,
  }));

  return (
    <Animated.View
      style={[style.contactItemContainer, animatedStyle, colorStyle]}
    >
      <Pressable
        onPress={() => handleSelectContact(contacts.recordID)}
        style={[{ flexDirection: "row", padding: 15 }]}
      >
        {contacts.thumbnailPath && (
          <Image
            source={{ uri: contacts.thumbnailPath }}
            style={style.contactAvatar}
          />
        )}
        <View>
          <Text
            style={[style.contactName, { color: "rgba(255, 255, 255, 0.5)" }]}
          >
            {contacts.displayName}
          </Text>
          <Text
            style={[style.contactNumber, { color: "rgba(255, 255, 255, 0.5)" }]}
          >
            {contacts.phoneNumbers[0]?.number}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default RenderContactList;

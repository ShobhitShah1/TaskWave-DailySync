import React, { FC, memo } from "react";
import { Image, Pressable, StyleSheet, Text } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import AssetsPath from "../../../Global/AssetsPath";
import TextString from "../../../Global/TextString";
import { FONTS, SIZE } from "../../../Global/Theme";
import useThemeColors from "../../../Theme/useThemeMode";
import { Contact } from "../../../Types/Interface";

interface AddContactProps {
  themeColor: string;
  onContactPress: () => void;
  selectedContacts: Contact[];
  onRemoveContact: (contact: Contact) => void;
}

const AddContact: FC<AddContactProps> = ({
  themeColor,
  onContactPress,
  selectedContacts,
  onRemoveContact,
}) => {
  const style = styles();
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onContactPress}
      style={[
        style.container,
        { backgroundColor: colors.scheduleReminderCardBackground },
      ]}
    >
      {selectedContacts.length === 0 ? (
        <Text style={[style.titleText, { color: colors.text }]}>
          {TextString.Contact}
        </Text>
      ) : (
        <Animated.View style={style.contactListContainer}>
          {selectedContacts.map((contact: Contact, index) => (
            <Animated.View
              key={index}
              layout={LinearTransition.springify().mass(0.5)}
            >
              <Pressable
                key={contact.recordID || index}
                style={[style.contactChip, { backgroundColor: themeColor }]}
                onPress={() => onRemoveContact(contact)}
              >
                <Text style={style.contactName}>{contact.name}</Text>
                <Text style={style.removeIcon}>✕</Text>
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      )}
      <Image
        resizeMode="contain"
        source={AssetsPath.ic_downArrow}
        style={style.downArrow}
      />
    </Pressable>
  );
};

export default memo(AddContact);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      minHeight: 50,
      width: "100%",
      marginBottom: 20,
      alignItems: "center",
      paddingHorizontal: 15,
      flexDirection: "row",
      justifyContent: "space-between",
      borderRadius: SIZE.listBorderRadius,
    },
    downArrow: {
      width: 15,
      height: 15,
    },
    titleText: {
      fontFamily: FONTS.Medium,
      fontSize: 17,
    },

    contactListContainer: {
      maxWidth: "80%",
      flexDirection: "row",
      flexWrap: "wrap",
      marginVertical: 10,
      paddingHorizontal: 5,
    },
    contactChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      margin: 5,
    },
    contactName: {
      color: colors.white,
      fontFamily: FONTS.Regular,
      fontSize: 16,
      marginRight: 5,
    },
    removeIcon: {
      color: colors.white,
      fontSize: 14,
      fontFamily: FONTS.Bold,
    },
  });
};

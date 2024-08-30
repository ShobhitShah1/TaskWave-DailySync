import { FlashList } from "@shopify/flash-list";
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";
import AssetsPath from "../../../Global/AssetsPath";
import useThemeColors from "../../../Theme/useThemeMode";
import { SimplifiedContact } from "../AddReminder";
import styles from "../styles";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import RenderContactList from "./RenderContactList";

const { height } = Dimensions.get("window");

interface ContactListModalProps {
  isVisible: boolean;
  onClose: () => void;
  contacts: SimplifiedContact[];
}

const ContactListModal: FC<ContactListModalProps> = ({
  isVisible,
  onClose,
  contacts,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const [searchText, setSearchText] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) =>
        contact.displayName.toLowerCase().includes(searchText.toLowerCase())
      ),
    [contacts, searchText]
  );

  const handleSelectContact = (contactId) => {
    setSelectedContact(contactId);
  };

  // const RenderContactList = ({ contacts }: { contacts: SimplifiedContact }) => {
  //   const scale = useSharedValue(0.8);
  //   const opacity = useSharedValue(0);

  //   useEffect(() => {
  //     scale.value = withSpring(1, { damping: 10 });
  //     opacity.value = withTiming(1, { duration: 300 });
  //   }, []);

  //   const animatedStyle = useAnimatedStyle(() => ({
  //     transform: [{ scale: scale.value }],
  //     opacity: opacity.value,
  //   }));

  //   const isSelected = selectedContact === contacts.recordID;
  //   const backgroundColor = useSharedValue(
  //     isSelected ? "rgba(0, 0, 255, 0.2)" : colors.reminderCardBackground
  //   );

  //   useEffect(() => {
  //     backgroundColor.value = withTiming(
  //       isSelected ? "rgba(0, 0, 255, 0.2)" : colors.reminderCardBackground,
  //       { duration: 500 }
  //     );
  //   }, [isSelected, backgroundColor]);

  //   const colorStyle = useAnimatedStyle(() => ({
  //     backgroundColor: backgroundColor.value,
  //   }));

  //   return (
  //     <Animated.View
  //       style={[style.contactItemContainer, animatedStyle, colorStyle]}
  //     >
  //       <Pressable
  //         onPress={() => handleSelectContact(contacts.recordID)}
  //         style={[{ flexDirection: "row", padding: 15 }]}
  //       >
  //         {contacts.thumbnailPath && (
  //           <Image
  //             source={{ uri: contacts.thumbnailPath }}
  //             style={style.contactAvatar}
  //           />
  //         )}
  //         <View>
  //           <Text
  //             style={[style.contactName, { color: "rgba(255, 255, 255, 0.5)" }]}
  //           >
  //             {contacts.displayName}
  //           </Text>
  //           <Text
  //             style={[
  //               style.contactNumber,
  //               { color: "rgba(255, 255, 255, 0.5)" },
  //             ]}
  //           >
  //             {contacts.phoneNumbers[0]?.number}
  //           </Text>
  //         </View>
  //       </Pressable>
  //     </Animated.View>
  //   );
  // };

  const handleOnClose = useCallback(() => onClose(), [onClose]);

  return (
    <Modal
      isVisible={isVisible}
      statusBarTranslucent
      style={{ margin: 0, justifyContent: "flex-end" }}
      deviceHeight={height + (StatusBar.currentHeight || 30)}
      onBackdropPress={handleOnClose}
    >
      <View style={[style.contactModalContainer, { paddingTop: 50 }]}>
        <View style={style.contactHeaderContainer}>
          <TouchableOpacity onPress={onClose}>
            <Image
              source={AssetsPath.ic_leftArrow}
              style={style.contactHeaderIcon}
            />
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Search.."
          placeholderTextColor={colors.placeholderText}
          style={[style.contactSearchInput, { color: colors.text }]}
          value={searchText}
          onChangeText={setSearchText}
        />

        <FlashList
          data={filteredContacts}
          extraData={selectedContact}
          estimatedItemSize={1000}
          keyExtractor={(item) => item.recordID}
          style={style.contactListContainer}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <RenderContactList
              contacts={item}
              selectedContact={selectedContact}
              handleSelectContact={handleSelectContact}
            />
          )}
        />

        <LinearGradient
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          colors={[
            "rgba(0,0,0,1)",
            "rgba(0,0,0,0.8)",
            "rgba(0,0,0,0.6)",
            "rgba(0,0,0,0.4)",
            "rgba(0,0,0,0.2)",
          ]}
          style={style.contactDoneButton}
        >
          <Pressable style={[style.contactDoneButtonView]} onPress={onClose}>
            <Text style={style.contactDoneButtonText}>Done</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default ContactListModal;

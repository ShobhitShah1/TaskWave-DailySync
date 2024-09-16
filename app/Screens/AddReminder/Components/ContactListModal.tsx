import { FlashList } from "@shopify/flash-list";
import React, { FC, useCallback, useMemo, useState } from "react";
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
import LinearGradient from "react-native-linear-gradient";
import Modal from "react-native-modal";
import AssetsPath from "../../../Global/AssetsPath";
import useThemeColors from "../../../Theme/useThemeMode";
import { SimplifiedContact } from "../../../Types/Interface";
import styles from "../styles";
import RenderContactList from "./RenderContactList";

const { height } = Dimensions.get("window");

interface ContactListModalProps {
  isVisible: boolean;
  onClose: () => void;
  contacts: SimplifiedContact[];
  selectedContacts: SimplifiedContact[];
  setSelectedContacts: React.Dispatch<
    React.SetStateAction<SimplifiedContact[]>
  >;
}

const ContactListModal: FC<ContactListModalProps> = ({
  isVisible,
  onClose,
  contacts,
  selectedContacts,
  setSelectedContacts,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const [searchText, setSearchText] = useState("");

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (contact) =>
          contact.phoneNumbers &&
          contact.displayName.toLowerCase().includes(searchText.toLowerCase())
      ),
    [contacts, searchText]
  );

  const handleSelectContact = useCallback((contact: SimplifiedContact) => {
    setSelectedContacts((prevSelectedContacts) =>
      prevSelectedContacts.some((c) => c.recordID === contact.recordID)
        ? prevSelectedContacts.filter((c) => c.recordID !== contact.recordID)
        : [...prevSelectedContacts, contact]
    );
  }, []);

  const handleOnClose = useCallback(() => onClose(), [onClose]);

  return (
    <Modal
      isVisible={isVisible}
      statusBarTranslucent={true}
      animationIn={"slideInUp"}
      animationOut={"slideOutDown"}
      animationInTiming={600}
      animationOutTiming={300}
      useNativeDriver={true}
      style={{ margin: 0, justifyContent: "flex-end" }}
      deviceHeight={height + (StatusBar.currentHeight || 30)}
      onBackdropPress={handleOnClose}
    >
      <View style={[style.contactModalContainer, { paddingTop: 50 }]}>
        <View style={style.contactHeaderContainer}>
          <TouchableOpacity onPress={onClose}>
            <Image
              tintColor={colors.text}
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
          extraData={selectedContacts}
          estimatedItemSize={200}
          keyExtractor={(item, index) => index.toString()}
          style={style.contactListContainer}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <RenderContactList
              contacts={item}
              selectedContacts={selectedContacts}
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

import { FlashList } from "@shopify/flash-list";
import React from "react";
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

const { height } = Dimensions.get("window");

interface ContactListModalProps {
  isVisible: boolean;
  onClose: () => void;
  contacts: SimplifiedContact[];
}

const ContactListModal: React.FC<ContactListModalProps> = ({
  isVisible,
  onClose,
  contacts,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const [searchText, setSearchText] = React.useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.displayName.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Modal
      isVisible={isVisible}
      statusBarTranslucent
      style={{ margin: 0, justifyContent: "flex-end" }}
      deviceHeight={height + (StatusBar.currentHeight || 30)}
      onBackdropPress={onClose}
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
          keyExtractor={(item) => item.recordID}
          style={style.contactListContainer}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <Pressable style={style.contactItemContainer}>
              {item.thumbnailPath && (
                <Image
                  source={{ uri: item.thumbnailPath }}
                  style={style.contactAvatar}
                />
              )}
              <View>
                <Text
                  style={[
                    style.contactName,
                    { color: "rgba(255, 255, 255, 0.5)" },
                  ]}
                >
                  {item.displayName}
                </Text>
                <Text
                  style={[
                    style.contactNumber,
                    { color: "rgba(255, 255, 255, 0.5)" },
                  ]}
                >
                  {item.phoneNumbers[0]?.number}
                </Text>
              </View>
            </Pressable>
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
            "rgba(0,0,0,0.0)",
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

import React from "react";
import { Text, View } from "react-native";
import AddContact from "../Components/AddContact";
import AddTelegramUsername from "../Components/AddTelegramUsername";
import ContactListModal from "../Components/ContactListModal";
import { ContactSelectorProps } from "../types";
import styles from "../styles";

const ContactSelector: React.FC<ContactSelectorProps> = ({
  contacts,
  setContacts,
  selectedContacts,
  setSelectedContacts,
  contactModalVisible,
  setContactModalVisible,
  isContactLoading,
  setIsContactLoading,
  onHandelContactClick,
  requestContactData,
  handleRemoveContact,
  themeColor,
  notificationType,
  telegramUsername,
  setTelegramUsername,
}) => {
  const style = styles();

  return (
    <>
      {notificationType !== "gmail" &&
        notificationType !== "note" &&
        (notificationType === "telegram"
          ? telegramUsername?.length === 0
          : true) && (
          <AddContact
            onContactPress={onHandelContactClick}
            themeColor={themeColor}
            selectedContacts={selectedContacts}
            onRemoveContact={handleRemoveContact}
          />
        )}

      {notificationType === "telegram" &&
        telegramUsername?.length === 0 &&
        selectedContacts.length === 0 && (
          <View style={style.orContainer}>
            <View style={style.orLine} />
            <Text style={style.orText}>Or</Text>
            <View style={style.orLine} />
          </View>
        )}

      {notificationType === "telegram" && selectedContacts.length === 0 && (
        <AddTelegramUsername
          telegramUsername={telegramUsername}
          setTelegramUsername={setTelegramUsername}
          themeColor={themeColor}
        />
      )}

      <ContactListModal
        contacts={contacts}
        isVisible={contactModalVisible}
        onRefreshData={requestContactData}
        selectedContacts={selectedContacts}
        notificationType={notificationType}
        refreshing={isContactLoading.isRefreshing}
        setSelectedContacts={setSelectedContacts}
        isContactLoading={isContactLoading.isLoading}
        onClose={() => setContactModalVisible(false)}
      />
    </>
  );
};

export default ContactSelector;

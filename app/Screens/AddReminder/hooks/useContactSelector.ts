import { useState } from "react";
import Contacts from "react-native-contacts";
import { Contact } from "../../../Types/Interface";
import { showMessage } from "react-native-flash-message";
import useContactPermission from "../../../Hooks/useContactPermission";

const useContactSelector = () => {
  const { requestPermission, checkPermissionStatus } = useContactPermission();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [isContactLoading, setIsContactLoading] = useState({
    isLoading: false,
    isRefreshing: false,
  });

  const onHandelContactClick = async () => {
    try {
      setIsContactLoading((prev) => ({
        ...prev,
        isLoading: true,
      }));

      const isPermissionEnable = await checkPermissionStatus();

      if (!isPermissionEnable) {
        const status = await requestPermission();
        if (status) {
          setContactModalVisible(true);
          requestContactData();
        }
        return;
      }

      setContactModalVisible(true);
      requestContactData();
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: "danger",
      });
      setIsContactLoading((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const requestContactData = async () => {
    try {
      const contactsData = await Contacts.getAll();
      const simplifiedContacts: Contact[] = contactsData
        .map((contact) => ({
          recordID: contact.recordID || "",
          name: contact.displayName,
          number: contact.phoneNumbers?.[0]?.number,
          hasThumbnail: contact.hasThumbnail,
        }))
        .sort((a, b) =>
          a?.name?.toLowerCase() > b?.name?.toLowerCase() ? 1 : -1
        );

      setContacts(simplifiedContacts);
    } catch (error: any) {
      const message = String(error?.message) || "Failed to fetch contacts.";
      showMessage({
        message: message,
        type: "danger",
      });
    } finally {
      setIsContactLoading((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const handleRemoveContact = (contactToRemove: Contact) => {
    setSelectedContacts((prevContacts) =>
      prevContacts.filter(
        (contact) => contact.recordID !== contactToRemove.recordID
      )
    );
  };

  return {
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
  };
};

export default useContactSelector; 
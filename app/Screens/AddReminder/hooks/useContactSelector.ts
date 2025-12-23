import { useContacts } from '@Contexts/ContactProvider';
import { Contact } from '@Types/Interface';
import { useEffect, useState } from 'react';
import { showMessage } from 'react-native-flash-message';

const useContactSelector = () => {
  const {
    contacts,
    isSyncing,
    permissionStatus,
    requestPermission,
    syncContacts: providerSyncContacts,
  } = useContacts();

  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const syncContacts = async (forceInContext = true) => {
    try {
      await providerSyncContacts(forceInContext);
    } catch (e: any) {
      showMessage({
        message: String(e?.message || e),
        type: 'danger',
      });
    }
  };

  const onHandelContactClick = async () => {
    // Check permission
    if (permissionStatus !== 'granted') {
      const status = await requestPermission();
      if (status !== 'granted') {
        showMessage({
          message: 'Permission denied',
          type: 'danger',
        });
        return;
      }
    }

    setContactModalVisible(true);

    // Sync if we haven't yet or just to be sure
    if (contacts.length === 0) {
      await syncContacts(true);
    }
  };

  const requestContactData = async () => {
    await syncContacts(true);
  };

  const handleRemoveContact = (contactToRemove: Contact) => {
    setSelectedContacts((prevContacts) =>
      prevContacts.filter((contact) => contact.recordID !== contactToRemove.recordID),
    );
  };

  return {
    contacts,
    selectedContacts,
    setSelectedContacts,
    contactModalVisible,
    setContactModalVisible,
    isContactLoading: { isLoading: isSyncing, isRefreshing: isSyncing },
    setIsContactLoading: () => {},
    onHandelContactClick,
    requestContactData,
    handleRemoveContact,
    syncContacts,
    hasSyncedOnce: contacts.length > 0,
  };
};

export default useContactSelector;

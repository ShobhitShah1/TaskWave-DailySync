import React, { useState } from 'react';
import Contacts from 'react-native-contacts';
import { showMessage } from 'react-native-flash-message';

import useContactPermission from '../../../Hooks/useContactPermission';
import useReminder from '../../../Hooks/useReminder';
import { Contact } from '../../../Types/Interface';

const useContactSelector = () => {
  const { requestPermission, checkPermissionStatus } = useContactPermission();
  const { getAllDeviceContacts, clearDeviceContacts, insertDeviceContacts } = useReminder();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [isContactLoading, setIsContactLoading] = useState({
    isLoading: false,
    isRefreshing: false,
  });
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);

  // Load contacts from SQLite on mount
  React.useEffect(() => {
    (async () => {
      try {
        const dbContacts = await getAllDeviceContacts();
        setContacts(dbContacts as Contact[]);
        setHasSyncedOnce((dbContacts as Contact[]).length > 0);
      } catch (e) {
        setContacts([]);
        setHasSyncedOnce(false);
      }
    })();
  }, []);

  // Helper to normalize phone numbers
  function normalizePhoneNumber(number: string): string {
    return number.replace(/[\s\-()]/g, '');
  }

  function isValidNumber(number: string): boolean {
    return /^((\+91\d{10})|(\+\d{1,3}\d{7,14})|([1-9]\d{6,14}))$/.test(number);
  }

  const syncContacts = async () => {
    setIsContactLoading((prev) => ({ ...prev, isRefreshing: true }));
    try {
      const isPermissionEnable = await checkPermissionStatus();
      if (!isPermissionEnable) {
        const status = await requestPermission();
        if (!status) throw new Error('Permission denied');
      }
      const contactsData = await Contacts.getAll();
      // For each contact, find the first valid, normalized number
      const simplifiedContacts = (
        contactsData
          .map((contact) => {
            const validNumberObj = (contact.phoneNumbers || []).find((p) => {
              const normalized = normalizePhoneNumber(p.number || '');
              return isValidNumber(normalized);
            });
            if (!validNumberObj) return null;
            const normalizedNumber = normalizePhoneNumber(validNumberObj.number);
            return {
              recordID: contact.recordID || '',
              name: contact.displayName,
              number: normalizedNumber,
              hasThumbnail: contact.hasThumbnail,
              thumbnailPath: contact.thumbnailPath,
            };
          })
          .filter(Boolean) as Contact[]
      ).sort((a, b) => (a?.name?.toLowerCase() > b?.name?.toLowerCase() ? 1 : -1));
      await clearDeviceContacts();
      await insertDeviceContacts(simplifiedContacts);
      setContacts(simplifiedContacts);
      setHasSyncedOnce(true);
    } catch (error: any) {
      showMessage({
        message: String(error?.message || error),
        type: 'danger',
      });
    } finally {
      setIsContactLoading((prev) => ({ ...prev, isRefreshing: false }));
    }
  };

  const onHandelContactClick = async () => {
    setContactModalVisible(true);
    if (!hasSyncedOnce) {
      setIsContactLoading((prev) => ({ ...prev, isLoading: true }));
      await syncContacts();
      setIsContactLoading((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const requestContactData = async () => {
    // For backward compatibility, just call syncContacts
    await syncContacts();
  };

  const handleRemoveContact = (contactToRemove: Contact) => {
    setSelectedContacts((prevContacts) =>
      prevContacts.filter((contact) => contact.recordID !== contactToRemove.recordID),
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
    syncContacts,
    hasSyncedOnce,
  };
};

export default useContactSelector;

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Contacts from 'react-native-contacts';
import { Platform, PermissionsAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, PermissionStatus } from 'react-native-permissions';
import { Contact } from '@Types/Interface';

interface ContactContextType {
  contacts: Contact[];
  isSyncing: boolean;
  permissionStatus: PermissionStatus;
  syncContacts: (force?: boolean) => Promise<void>;
  requestPermission: () => Promise<PermissionStatus>;
  checkPermission: () => Promise<PermissionStatus>;
}

const ContactContext = createContext<ContactContextType>({
  contacts: [],
  isSyncing: false,
  permissionStatus: 'unavailable',
  syncContacts: async () => {},
  requestPermission: async () => 'unavailable',
  checkPermission: async () => 'unavailable',
});

export const ContactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unavailable');

  const checkPermission = useCallback(async () => {
    let status: PermissionStatus = 'unavailable';

    if (Platform.OS === 'android') {
      const androidPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      );
      status = androidPermission ? 'granted' : 'denied';
      // Falls back to checking via rn-permissions if needed, but direct check is often reliable for contacts
      if (!androidPermission) {
        status = await check(PERMISSIONS.ANDROID.READ_CONTACTS);
      }
    } else {
      status = await check(PERMISSIONS.IOS.CONTACTS);
    }

    setPermissionStatus(status);
    return status;
  }, []);

  const requestPermission = useCallback(async () => {
    let status: PermissionStatus = 'unavailable';

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'This app would like to view your contacts.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      status = granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
    } else {
      status = await request(PERMISSIONS.IOS.CONTACTS);
    }

    setPermissionStatus(status);
    if (status === 'granted') {
      syncContacts(true);
    }
    return status;
  }, []);

  // Helper to normalize phone numbers
  const normalizePhoneNumber = (number: string): string => {
    return number.replace(/[\s\-()]/g, '');
  };

  const isValidNumber = (number: string): boolean => {
    return /^((\+91\d{10})|(\+\d{1,3}\d{7,14})|([1-9]\d{6,14}))$/.test(number);
  };

  const syncContacts = useCallback(
    async (force = false) => {
      if (isSyncing) return;

      const status = await checkPermission();
      if (status !== 'granted') {
        if (force) {
          // If forced, maybe we requested it just now.
        } else {
          return;
        }
      }

      setIsSyncing(true);
      try {
        const contactsData = await Contacts.getAll();

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
                name: contact.displayName || [contact.givenName, contact.familyName].join(' '),
                number: normalizedNumber,
                hasThumbnail: contact.hasThumbnail,
                thumbnailPath: contact.thumbnailPath,
              };
            })
            .filter(Boolean) as Contact[]
        ).sort((a, b) => (a?.name?.toLowerCase() > b?.name?.toLowerCase() ? 1 : -1));

        setContacts(simplifiedContacts);
      } catch (error) {
        console.error('Error syncing contacts', error);
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing, checkPermission],
  );

  useEffect(() => {
    checkPermission().then((status) => {
      if (status === 'granted') {
        syncContacts();
      }
    });
  }, []);

  return (
    <ContactContext.Provider
      value={{
        contacts,
        isSyncing,
        permissionStatus,
        syncContacts,
        requestPermission,
        checkPermission,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
};

export const useContacts = () => useContext(ContactContext);

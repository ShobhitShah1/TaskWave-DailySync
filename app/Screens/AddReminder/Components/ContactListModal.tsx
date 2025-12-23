import ReusableBottomSheet from '@Components/ReusableBottomSheet';
import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import useThemeColors from '@Hooks/useThemeMode';
import { Contact, ContactListModalProps } from '@Types/Interface';
import { LinearGradient } from 'expo-linear-gradient';
import React, { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../styles';
import RenderContactList from './RenderContactList';

interface ContactListModalPropsWithSync extends ContactListModalProps {
  syncContacts: () => void;
  isSyncing: boolean;
}

const isValidContact = (contact: Contact): boolean => {
  if (!contact.number) return false;
  const number = contact.number.trim();
  return /^(\+91\d{10}|\+\d{1,3}\d{7,14}|[1-9]\d{6,14})$/.test(number);
};

const useFilteredContacts = (contacts: Contact[], searchText: string) => {
  return useMemo(() => {
    if (!searchText.trim()) {
      return contacts.filter(isValidContact);
    }

    const lowerSearchText = searchText.toLowerCase().trim();
    return contacts.filter((contact) => {
      if (!isValidContact(contact)) return false;
      const name = contact.name?.toLowerCase();
      return name?.includes(lowerSearchText);
    });
  }, [contacts, searchText]);
};

const ContactListEmptyView = memo(() => {
  const colors = useThemeColors();

  return (
    <View style={localStyles.emptyContainer}>
      <Image
        style={[localStyles.emptyIcon, { tintColor: colors.placeholderText }]}
        source={AssetsPath.ic_contact}
        resizeMode="contain"
      />
      <Text style={[localStyles.emptyTitle, { color: colors.text }]}>No Contacts Found</Text>
      <Text style={[localStyles.emptySubtitle, { color: colors.placeholderText }]}>
        Try syncing or adding contacts.
      </Text>
    </View>
  );
});

const ContactListModal: FC<ContactListModalPropsWithSync> = ({
  isVisible,
  onClose,
  contacts,
  selectedContacts,
  isContactLoading,
  notificationType,
  setSelectedContacts,
  syncContacts,
  isSyncing,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contactModalRef = useRef<BottomSheetModal>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  React.useEffect(() => {
    if (isVisible) {
      contactModalRef.current?.present();
    } else {
      contactModalRef.current?.dismiss();
    }
  }, [isVisible]);

  React.useEffect(() => {
    if (!isVisible) {
      setSearchText('');
      setDebouncedSearchText('');
    }
  }, [isVisible]);

  const handleClose = useCallback(() => {
    onClose();
    contactModalRef.current?.dismiss();
  }, [onClose]);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchText(text);
    }, 300);
  }, []);

  const filteredContacts = useFilteredContacts(contacts, debouncedSearchText);

  const handleSelectContact = useCallback(
    (contact: Contact) => {
      setSelectedContacts((prevSelectedContacts) => {
        const isSingleSelect = ['whatsapp', 'whatsappBusiness', 'phone', 'telegram'].includes(
          notificationType,
        );

        if (isSingleSelect) {
          handleClose();
          return [contact];
        } else {
          const isSelected = prevSelectedContacts?.some((c) => c?.recordID === contact?.recordID);

          return isSelected
            ? prevSelectedContacts?.filter((c) => c?.recordID !== contact?.recordID)
            : [...prevSelectedContacts, contact];
        }
      });
    },
    [notificationType, setSelectedContacts, handleClose],
  );

  const renderContactItem = useCallback(
    ({ item }: { item: Contact }) => (
      <RenderContactList
        contacts={item}
        selectedContacts={selectedContacts}
        handleSelectContact={handleSelectContact}
      />
    ),
    [selectedContacts, handleSelectContact],
  );

  return (
    <ReusableBottomSheet snapPoints={['100%']} ref={contactModalRef} onDismiss={onClose} index={0}>
      <SafeAreaView style={style.contactModalContainer}>
        <View style={style.contactHeaderContainer}>
          <Pressable hitSlop={15} onPress={handleClose}>
            <Image
              tintColor={colors.text}
              source={AssetsPath.ic_leftArrow}
              style={style.contactHeaderIcon}
            />
          </Pressable>
          <Pressable
            style={localStyles.syncButton}
            hitSlop={15}
            onPress={() => syncContacts()}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Image
                tintColor={colors.text}
                source={AssetsPath.ic_sync}
                style={localStyles.syncIcon}
              />
            )}
          </Pressable>
        </View>

        <BottomSheetTextInput
          placeholder="Search.."
          placeholderTextColor={colors.placeholderText}
          style={[style.contactSearchInput, { color: colors.text }]}
          value={searchText}
          onChangeText={handleSearchTextChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {isContactLoading ? (
          <View style={style.contactLoadingContainer}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[style.loadingText, { color: colors.text, marginTop: 10 }]}>
              Loading contacts...
            </Text>
          </View>
        ) : (
          <BottomSheetFlatList
            style={{ flex: 1 }}
            data={filteredContacts}
            renderItem={renderContactItem}
            keyExtractor={(item: Contact) => item.recordID?.toString()}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
            extraData={selectedContacts}
            ListEmptyComponent={ContactListEmptyView}
          />
        )}
      </SafeAreaView>

      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        colors={['rgba(48, 51, 52, 0.06)', 'rgba(7, 7, 7, 1)']}
        style={localStyles.footerGradient}
      >
        <Pressable style={style.contactDoneButtonView} onPress={handleClose}>
          <Text style={style.contactDoneButtonText}>Done</Text>
        </Pressable>
      </LinearGradient>
    </ReusableBottomSheet>
  );
};

const localStyles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: FONTS.Medium,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    fontFamily: FONTS.Regular,
    maxWidth: 220,
  },
  syncButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  footerGradient: {
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 35,
  },
});

export default memo(ContactListModal);

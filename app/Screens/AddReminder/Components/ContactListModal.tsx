import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Contact, ContactListModalProps } from '@Types/Interface';
import { LinearGradient } from 'expo-linear-gradient';
import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from '../styles';
import RenderContactList from './RenderContactList';

interface ContactListModalPropsWithSync extends ContactListModalProps {
  syncContacts: () => void;
  isSyncing: boolean;
}

// Optimized contact validation with regex caching
const PHONE_REGEX = /^(\+91\d{10}|\+\d{1,3}\d{7,14}|[1-9]\d{6,14})$/;
const isValidContact = (contact: Contact): boolean => {
  if (!contact.number) return false;
  return PHONE_REGEX.test(contact.number.trim());
};

// Custom hook for filtered contacts with memoization
const useFilteredContacts = (contacts: Contact[], searchText: string) => {
  return useMemo(() => {
    const trimmedSearch = searchText.trim().toLowerCase();

    if (!trimmedSearch) {
      return contacts.filter(isValidContact);
    }

    return contacts.filter((contact) => {
      if (!isValidContact(contact)) return false;
      return contact.name?.toLowerCase().includes(trimmedSearch);
    });
  }, [contacts, searchText]);
};

// Memoized empty view component
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

// Header component with search - optimized as ReactElement for better performance
interface HeaderProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  onClose: () => void;
  onSync: () => void;
  isSyncing: boolean;
  colors: ReturnType<typeof useThemeColors>;
  style: ReturnType<typeof styles>;
}

const ContactHeader = memo<HeaderProps>(
  ({ searchText, onSearchChange, onClose, onSync, isSyncing, colors, style }) => (
    <View style={localStyles.headerWrapper}>
      <View style={style.contactHeaderContainer}>
        <Pressable hitSlop={15} onPress={onClose}>
          <Image
            tintColor={colors.text}
            source={AssetsPath.ic_leftArrow}
            style={style.contactHeaderIcon}
          />
        </Pressable>
        <Pressable
          style={localStyles.syncButton}
          hitSlop={15}
          onPress={onSync}
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

      <TextInput
        placeholder="Search.."
        placeholderTextColor={colors.placeholderText}
        style={[style.contactSearchInput, { color: colors.text }]}
        value={searchText}
        onChangeText={onSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  ),
);

// Footer component with safe area handling
interface FooterProps {
  onClose: () => void;
  style: ReturnType<typeof styles>;
}

const ContactFooter = memo<FooterProps>(({ onClose, style }) => {
  const insets = useSafeAreaInsets();
  const isIPad = Platform.OS === 'ios' && Platform.isPad;
  const bottomInset = isIPad ? 0 : insets.bottom;

  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      colors={['rgba(48, 51, 52, 0.06)', 'rgba(7, 7, 7, 1)']}
      style={[localStyles.footerGradient, { paddingBottom: bottomInset }]}
    >
      <Pressable style={style.contactDoneButtonView} onPress={onClose}>
        <Text style={style.contactDoneButtonText}>Done</Text>
      </Pressable>
    </LinearGradient>
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
  const sheetRef = useRef<TrueSheet>(null);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  // Present/dismiss sheet based on visibility
  useEffect(() => {
    if (isVisible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isVisible]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isVisible) {
      setSearchText('');
      setDebouncedSearchText('');
    }
  }, [isVisible]);

  const handleClose = useCallback(() => {
    sheetRef.current?.dismiss();
    onClose();
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

  const handleSync = useCallback(() => {
    syncContacts();
  }, [syncContacts]);

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

  // Optimized renderItem with useCallback
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

  // Optimized keyExtractor
  const keyExtractor = useCallback((item: Contact) => item.recordID?.toString(), []);

  // Memoized header component as ReactElement for best performance
  const headerComponent = useMemo(
    () => (
      <ContactHeader
        searchText={searchText}
        onSearchChange={handleSearchTextChange}
        onClose={handleClose}
        onSync={handleSync}
        isSyncing={isSyncing}
        colors={colors}
        style={style}
      />
    ),
    [searchText, handleSearchTextChange, handleClose, handleSync, isSyncing, colors, style],
  );

  // Memoized footer component as ReactElement for best performance
  const footerComponent = useMemo(
    () => <ContactFooter onClose={handleClose} style={style} />,
    [handleClose, style],
  );

  // Memoized content container style
  const contentContainerStyle = useMemo(() => ({ paddingBottom: 100, flexGrow: 1 }), []);

  return (
    <TrueSheet
      ref={sheetRef}
      name="contact-list-modal"
      detents={[1]}
      cornerRadius={0}
      backgroundColor={colors.background}
      grabber={false}
      dimmed
      dismissible
      scrollable
      onDidDismiss={onClose}
      header={headerComponent}
      footer={footerComponent}
    >
      <View style={style.contactModalContainer}>
        {isContactLoading ? (
          <View style={style.contactLoadingContainer}>
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[style.loadingText, { color: colors.text, marginTop: 10 }]}>
              Loading contacts...
            </Text>
          </View>
        ) : (
          <FlatList
            style={localStyles.flatList}
            data={filteredContacts}
            renderItem={renderContactItem}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={contentContainerStyle}
            extraData={selectedContacts}
            ListEmptyComponent={ContactListEmptyView}
            nestedScrollEnabled
            removeClippedSubviews
            maxToRenderPerBatch={15}
            windowSize={10}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            getItemLayout={undefined}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </TrueSheet>
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
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  flatList: {
    flex: 1,
  },
});

export default memo(ContactListModal);

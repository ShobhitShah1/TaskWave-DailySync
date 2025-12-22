import {
  BottomSheetFlatList,
  BottomSheetTextInput,
  BottomSheetFlatListMethods,
  BottomSheetFooter,
  BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import ReusableBottomSheet from '@Components/ReusableBottomSheet';
import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import { Contact, ContactListModalProps } from '@Types/Interface';
import styles from '../styles';
import RenderContactList from './RenderContactList';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const flatListRef = useRef<BottomSheetFlatListMethods>(null);
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

  const keyExtractor = useCallback((item: Contact) => item.recordID?.toString(), []);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 1)']}
          style={localStyles.footerGradient}
        >
          <Pressable style={style.contactDoneButtonView} onPress={handleClose}>
            <Text style={style.contactDoneButtonText}>Done</Text>
          </Pressable>
        </LinearGradient>
      </BottomSheetFooter>
    ),
    [handleClose, style.contactDoneButtonView, style.contactDoneButtonText],
  );

  const listContentStyle = useMemo(() => ({ paddingBottom: 80, flexGrow: 1 }), []);

  return (
    <ReusableBottomSheet
      snapPoints={['100%']}
      ref={contactModalRef}
      onDismiss={onClose}
      index={0}

      // footerComponent={renderFooter}
    >
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
            onPress={syncContacts}
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
            ref={flatListRef}
            data={filteredContacts}
            renderItem={renderContactItem}
            keyExtractor={keyExtractor}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            updateCellsBatchingPeriod={100}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={listContentStyle}
            extraData={selectedContacts}
            ListEmptyComponent={ContactListEmptyView}
            getItemLayout={(_: any, index: number) => ({
              length: 70,
              offset: 70 * index,
              index,
            })}
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

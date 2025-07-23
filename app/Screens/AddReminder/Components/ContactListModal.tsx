import {
  BottomSheetFlatList,
  BottomSheetTextInput,
  BottomSheetFlatListMethods,
} from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import ReusableBottomSheet from '@Components/ReusableBottomSheet';
import AssetsPath from '@Constants/AssetsPath';
import useThemeColors from '@Hooks/useThemeMode';
import { Contact, ContactListModalProps } from '@Types/Interface';
import styles from '../styles';
import RenderContactList from './RenderContactList';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

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
    <Animated.View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}
    >
      <Image
        style={{ width: 80, height: 80, marginBottom: 18, tintColor: colors.placeholderText }}
        source={AssetsPath.ic_contact}
        resizeMode="contain"
      />
      <Text
        style={{
          fontSize: 20,
          color: colors.text,
          fontFamily: 'ClashGrotesk-Medium',
          marginBottom: 6,
        }}
      >
        No Contacts Found
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: colors.placeholderText,
          textAlign: 'center',
          fontFamily: 'ClashGrotesk-Regular',
          maxWidth: 220,
        }}
      >
        Try syncing or adding contacts.
      </Text>
    </Animated.View>
  );
});

const ContactListModal: FC<ContactListModalPropsWithSync> = ({
  isVisible,
  onClose,
  contacts,
  refreshing,
  onRefreshData,
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

  // Present/dismiss bottom sheet based on isVisible
  React.useEffect(() => {
    if (isVisible) {
      contactModalRef.current?.present();
    } else {
      contactModalRef.current?.dismiss();
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

  React.useEffect(() => {
    if (!isVisible) {
      setSearchText('');
      setDebouncedSearchText('');
    }
  }, [isVisible]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        colors={[colors.text]}
        onRefresh={onRefreshData}
        progressBackgroundColor={colors.background}
        tintColor={colors.text}
      />
    ),
    [refreshing, colors.text, colors.background, onRefreshData],
  );

  return (
    <ReusableBottomSheet snapPoints={['100%']} ref={contactModalRef} onDismiss={onClose}>
      <View style={[style.contactModalContainer, { paddingTop: 20, flex: 1 }]}>
        <View style={style.contactHeaderContainer}>
          <Pressable hitSlop={15} onPress={handleClose}>
            <Image
              tintColor={colors.text}
              source={AssetsPath.ic_leftArrow}
              style={style.contactHeaderIcon}
            />
          </Pressable>
          <Pressable
            style={{ width: 30, height: 30 }}
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
                style={[style.contactHeaderIcon, { width: '100%', height: '100%' }]}
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
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={style.contactLoadingContainer}
          >
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[style.loadingText, { color: colors.text, marginTop: 10 }]}>
              Loading contacts...
            </Text>
          </Animated.View>
        ) : (
          <BottomSheetFlatList
            ref={flatListRef}
            data={filteredContacts}
            renderItem={renderContactItem}
            keyExtractor={(item) => item.recordID?.toString()}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
            extraData={selectedContacts}
            ListEmptyComponent={<ContactListEmptyView />}
          />
        )}
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 1)']}
          style={[style.contactDoneButton, { backgroundColor: 'transparent' }]}
          pointerEvents="none"
        >
          <Pressable
            style={style.contactDoneButtonView}
            onPress={handleClose}
            android_ripple={{ color: colors.text + '30' }}
          >
            <Text style={style.contactDoneButtonText}>Done</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </ReusableBottomSheet>
  );
};

export default memo(ContactListModal);

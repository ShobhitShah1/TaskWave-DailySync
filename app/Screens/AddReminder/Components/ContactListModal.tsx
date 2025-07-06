import React, { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modal';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import AssetsPath from '../../../Constants/AssetsPath';
import useThemeColors from '../../../Hooks/useThemeMode';
import { Contact, ContactListModalProps } from '../../../Types/Interface';
import styles from '../styles';
import RenderContactList from './RenderContactList';

const { height } = Dimensions.get('window');

// Memoized search input component
const SearchInput = memo(
  ({
    value,
    onChangeText,
    colors,
    style,
  }: {
    value: string;
    onChangeText: (text: string) => void;
    colors: any;
    style: any;
  }) => (
    <TextInput
      placeholder="Search.."
      placeholderTextColor={colors.placeholderText}
      style={[style.contactSearchInput, { color: colors.text }]}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="while-editing"
      returnKeyType="search"
      blurOnSubmit={true}
    />
  ),
);

// Optimized contact validation function
const isValidContact = (contact: Contact): boolean => {
  if (!contact.number) return false;

  const number = contact.number.trim();

  // Combined regex for better performance
  return /^(\+91\d{10}|\+\d{1,3}\d{7,14}|[1-9]\d{6,14})$/.test(number);
};

// Memoized filtered contacts hook
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

// Optimized render item component
const ContactItem = memo(
  ({
    item,
    selectedContacts,
    handleSelectContact,
  }: {
    item: Contact;
    selectedContacts: Contact[];
    handleSelectContact: (contact: Contact) => void;
  }) => (
    <RenderContactList
      contacts={item}
      selectedContacts={selectedContacts}
      handleSelectContact={handleSelectContact}
    />
  ),
);

const ContactListModal: FC<ContactListModalProps> = ({
  isVisible,
  onClose,
  contacts,
  refreshing,
  onRefreshData,
  selectedContacts,
  isContactLoading,
  notificationType,
  setSelectedContacts,
}) => {
  const style = styles();
  const colors = useThemeColors();
  const [searchText, setSearchText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Modal state management
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search to prevent excessive filtering
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized close handler
  const handleClose = useCallback(() => {
    if (isClosing) return; // Prevent multiple close calls

    setIsClosing(true);

    // Clear any existing timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    // Immediate close for better UX
    onClose();

    // Reset closing state after animation
    closeTimeoutRef.current = setTimeout(() => {
      setIsClosing(false);
    }, 350);
  }, [isClosing, onClose]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
      if (isClosing) return; // Prevent actions while closing

      setSelectedContacts((prevSelectedContacts) => {
        const isSingleSelect = ['whatsapp', 'whatsappBusiness', 'phone', 'telegram'].includes(
          notificationType,
        );

        if (isSingleSelect) {
          // Immediate close without animation delay
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
    [notificationType, setSelectedContacts, handleClose, isClosing],
  );

  // Optimized render item with getItemLayout for better performance
  const renderContactItem = useCallback(
    ({ item }: { item: Contact }) => (
      <ContactItem
        item={item}
        selectedContacts={selectedContacts}
        handleSelectContact={handleSelectContact}
      />
    ),
    [selectedContacts, handleSelectContact],
  );

  const keyExtractor = useCallback((item: Contact) => item.recordID, []);

  // Reset search when modal closes
  React.useEffect(() => {
    if (!isVisible) {
      setSearchText('');
      setDebouncedSearchText('');
    }
  }, [isVisible]);

  // Estimated item height for getItemLayout (adjust based on your item height)
  const ITEM_HEIGHT = 70;
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  // Optimized refresh control
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
    <Modal
      isVisible={isVisible && !isClosing}
      hideModalContentWhileAnimating={true}
      statusBarTranslucent={true}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={250}
      useNativeDriver={true}
      useNativeDriverForBackdrop={true}
      hasBackdrop={false}
      onBackButtonPress={handleClose}
      style={{ margin: 0, justifyContent: 'flex-end' }}
      deviceHeight={height + (StatusBar.currentHeight || 30)}
      avoidKeyboard={true}
      backdropTransitionOutTiming={0}
    >
      <View style={[style.contactModalContainer, { paddingTop: 50 }]}>
        <View style={style.contactHeaderContainer}>
          <Pressable
            hitSlop={15}
            onPress={handleClose}
            disabled={isClosing}
            android_ripple={{ color: colors.text + '20', radius: 20 }}
          >
            <Image
              tintColor={colors.text}
              source={AssetsPath.ic_leftArrow}
              style={style.contactHeaderIcon}
            />
          </Pressable>
        </View>

        <SearchInput
          value={searchText}
          onChangeText={handleSearchTextChange}
          colors={colors}
          style={style}
        />

        {isContactLoading ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            style={style.contactLoadingContainer}
          >
            <ActivityIndicator size="large" color={colors.text} />
            <Text style={[style.loadingText, { color: colors.text, marginTop: 10 }]}>
              Loading contacts...
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredContacts}
            refreshControl={refreshControl}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            // Optimized performance props
            maxToRenderPerBatch={20}
            initialNumToRender={15}
            windowSize={10}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}
            // getItemLayout={getItemLayout} // Enable if all items have consistent height
            contentContainerStyle={{ paddingBottom: 100 }}
            keyExtractor={keyExtractor}
            renderItem={renderContactItem}
            // Better memory management
            onEndReachedThreshold={0.5}
            scrollEventThrottle={16}
            // Prevent unnecessary re-renders
            extraData={selectedContacts}
          />
        )}

        <LinearGradient
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          colors={[
            colors.background,
            colors.background + 'F0',
            colors.background + 'E0',
            colors.background + 'C0',
            colors.background + 'A0',
            colors.background + '80',
            colors.background + '60',
            colors.background + '40',
            colors.background + '20',
            colors.background + '10',
            colors.background + '00',
          ]}
          style={style.contactDoneButton}
        >
          <Pressable
            style={style.contactDoneButtonView}
            onPress={handleClose}
            disabled={isClosing}
            android_ripple={{ color: colors.text + '30' }}
          >
            <Text style={style.contactDoneButtonText}>Done</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default memo(ContactListModal);

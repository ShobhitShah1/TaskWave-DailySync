import { FONTS } from '@Constants/Theme';
import AssetsPath from '@Constants/AssetsPath';
import { useContacts } from '@Contexts/ContactProvider';
import { useRegisteredAlarmUsers } from '@Hooks/useAlarm';
import useThemeColors from '@Hooks/useThemeMode';
import { useAuth } from '@Hooks/useAuth';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { AlarmRegisteredUser } from '@Types/Alarm';
import { toAlarmPhoneContact, maskAlarmPhoneNumber } from '@Utils/alarmPhone';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

interface RegisteredUserPickerProps {
  visible: boolean;
  selectedUsers: AlarmRegisteredUser[];
  onClose: () => void;
  onChange: (users: AlarmRegisteredUser[]) => void;
}

const RegisteredUserPicker: React.FC<RegisteredUserPickerProps> = ({
  visible,
  selectedUsers,
  onClose,
  onChange,
}) => {
  const { auth } = useAuth();
  const colors = useThemeColors();
  const { contacts } = useContacts();
  const sheetRef = useRef<TrueSheet>(null);
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');

  const alarmContacts = useMemo(
    () =>
      contacts
        .map(toAlarmPhoneContact)
        .filter((contact): contact is NonNullable<typeof contact> => Boolean(contact)),
    [contacts],
  );

  const { data = [], isLoading } = useRegisteredAlarmUsers(visible, alarmContacts);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
      setSearchText('');
    }
  }, [visible]);

  const selectedIds = useMemo(
    () => new Set(selectedUsers.map((user) => user.userId)),
    [selectedUsers],
  );

  const toggleUser = (user: AlarmRegisteredUser) => {
    if (selectedIds.has(user.userId)) {
      onChange(selectedUsers.filter((item) => item.userId !== user.userId));
      return;
    }
    onChange([...selectedUsers, user]);
  };

  const filteredData = useMemo(() => {
    let result = data;

    if (auth?.user?.id) {
      result = result.filter((item) => item.userId !== auth.user.id);
    }

    if (!searchText.trim()) return result;
    const lowerSearch = searchText.toLowerCase();
    return result.filter(
      (item) =>
        item.fullName.toLowerCase().includes(lowerSearch) || item.phoneNumber.includes(lowerSearch),
    );
  }, [data, searchText, auth?.user?.id]);

  const bottomInset = Platform.OS === 'ios' && Platform.isPad ? 0 : insets.bottom;

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      <View style={styles.contactHeaderContainer}>
        <Pressable hitSlop={15} onPress={onClose}>
          <Image
            tintColor={colors.text}
            source={AssetsPath.ic_leftArrow}
            style={styles.contactHeaderIcon}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Contacts</Text>
      </View>

      <TextInput
        placeholder="Search.."
        placeholderTextColor={colors.placeholderText || colors.grayTitle}
        style={[
          styles.contactSearchInput,
          { color: colors.text, borderColor: colors.contactBackground },
        ]}
        value={searchText}
        onChangeText={setSearchText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );

  const renderFooter = () => (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      colors={['rgba(48, 51, 52, 0.06)', 'rgba(7, 7, 7, 1)']}
      style={[styles.footerGradient, { paddingBottom: bottomInset }]}
    >
      <Pressable
        style={[styles.contactDoneButtonView, { backgroundColor: '#B4C2FF' }]}
        onPress={onClose}
      >
        <Text style={styles.contactDoneButtonText}>Done</Text>
      </Pressable>
    </LinearGradient>
  );

  return (
    <TrueSheet
      ref={sheetRef}
      name="registered-user-picker-sheet"
      detents={[1]}
      cornerRadius={0}
      backgroundColor={colors.background}
      grabber={false}
      dimmed
      dismissible
      scrollable
      onDidDismiss={onClose}
      header={renderHeader()}
      footer={renderFooter()}
    >
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.darkBlue || '#B4C2FF'} size="large" />
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading contacts...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.userId}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = selectedIds.has(item.userId);
              return (
                <Pressable
                  onPress={() => toggleUser(item)}
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.contactBackground,
                      borderColor: isSelected ? '#B4C2FF' : 'transparent',
                    },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: '#B4C2FF' }]}>
                    <Text style={styles.avatarText}>{item.fullName.slice(0, 1).toUpperCase()}</Text>
                  </View>

                  <View style={styles.rowBody}>
                    <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
                      {item.displayName || item.fullName}
                    </Text>
                    <Text style={[styles.number, { color: colors.grayTitle }]}>
                      {maskAlarmPhoneNumber(item.phoneCountryCode, item.phoneNumber)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.check,
                      {
                        backgroundColor: isSelected ? '#B4C2FF' : 'transparent',
                        borderColor: isSelected ? '#B4C2FF' : colors.borderColor,
                      },
                    ]}
                  >
                    {isSelected ? <Text style={styles.checkText}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.centerState}>
                <Image
                  style={[
                    styles.emptyIcon,
                    { tintColor: colors.placeholderText || colors.grayTitle },
                  ]}
                  source={AssetsPath.ic_contact}
                  resizeMode="contain"
                />
                <Text style={[styles.emptyText, { color: colors.text }]}>No contacts found.</Text>
              </View>
            }
          />
        )}
      </View>
    </TrueSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  contactHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 44,
  },
  contactHeaderIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    marginLeft: 15,
    fontSize: 20,
    fontFamily: FONTS.SemiBold,
  },
  contactSearchInput: {
    height: 45,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  footerGradient: {
    width: '100%',
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactDoneButtonView: {
    width: '90%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactDoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    paddingTop: 10,
    gap: 12,
  },
  row: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
  },
  rowBody: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: FONTS.SemiBold,
  },
  number: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: FONTS.Medium,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.Bold,
  },
  centerState: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    fontFamily: FONTS.Medium,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 18,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.Medium,
  },
});

export default RegisteredUserPicker;

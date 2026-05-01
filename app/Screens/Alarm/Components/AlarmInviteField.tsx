import AssetsPath from '@Constants/AssetsPath';
import { FONTS, SIZE } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import { AlarmRegisteredUser } from '@Types/Alarm';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface AlarmInviteFieldProps {
  selectedUsers: AlarmRegisteredUser[];
  onPress: () => void;
  onRemoveUser?: (user: AlarmRegisteredUser) => void;
  themeColor: string;
}

const AlarmInviteField: React.FC<AlarmInviteFieldProps> = ({
  selectedUsers,
  onPress,
  onRemoveUser,
  themeColor,
}) => {
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.scheduleReminderCardBackground,
          paddingLeft: selectedUsers.length === 0 ? 15 : 5,
        },
      ]}
    >
      {selectedUsers.length === 0 ? (
        <Text style={[styles.placeholder, { color: colors.placeholderText }]}>Contact</Text>
      ) : (
        <View style={styles.chipsWrap}>
          {selectedUsers.map((user) => (
            <Pressable
              key={user.userId}
              onPress={() => onRemoveUser?.(user)}
              style={[styles.chip, { backgroundColor: themeColor }]}
            >
              <Text style={styles.chipText}>
                {(user.displayName || user.fullName).split(' ')[0]}
              </Text>
              <Text style={styles.removeText}>x</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Image resizeMode="contain" source={AssetsPath.ic_downArrow} style={styles.downArrow} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 50,
    width: '100%',
    marginBottom: 15,
    alignItems: 'center',
    paddingRight: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: SIZE.listBorderRadius,
  },
  placeholder: {
    fontFamily: FONTS.Medium,
    fontSize: 17,
  },
  chipsWrap: {
    maxWidth: '82%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    margin: 5,
  },
  chipText: {
    color: '#fff',
    fontFamily: FONTS.Medium,
    fontSize: 15.5,
    marginRight: 5,
  },
  removeText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.Bold,
  },
  downArrow: {
    width: 15,
    height: 15,
  },
});

export default AlarmInviteField;

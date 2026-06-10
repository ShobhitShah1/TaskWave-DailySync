import React, { FC } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';

interface AlarmScheduleRowProps {
  themeColor: string;
  onDatePress: () => void;
  onTimePress: () => void;
  onBufferPress: () => void;
  selectedDateAndTime: { date: Date | undefined; time: Date | undefined };
  bufferMinutes: number;
}

const AlarmScheduleRow: FC<AlarmScheduleRowProps> = ({
  themeColor,
  onDatePress,
  onTimePress,
  onBufferPress,
  selectedDateAndTime,
  bufferMinutes,
}) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Schedule:</Text>
      <View style={styles.row}>
        {/* Date Field */}
        <View style={styles.fieldCol}>
          <Text style={[styles.label, { color: colors.text }]}>Date:</Text>
          <Pressable
            onPress={onDatePress}
            style={[styles.fieldBox, { backgroundColor: colors.scheduleReminderCardBackground }]}
          >
            <Image tintColor={themeColor} source={AssetsPath.ic_calender} style={styles.icon} />
            <Text
              numberOfLines={1}
              style={[
                styles.valueText,
                { color: selectedDateAndTime.date ? colors.text : colors.placeholderText },
              ]}
            >
              {selectedDateAndTime.date
                ? new Date(selectedDateAndTime.date).toLocaleDateString()
                : 'DD/MM/YY'}
            </Text>
          </Pressable>
        </View>

        {/* Time Field */}
        <View style={styles.fieldCol}>
          <Text style={[styles.label, { color: colors.text }]}>Time:</Text>
          <Pressable
            onPress={onTimePress}
            style={[styles.fieldBox, { backgroundColor: colors.scheduleReminderCardBackground }]}
          >
            <Image tintColor={themeColor} source={AssetsPath.ic_time} style={styles.icon} />
            <Text
              numberOfLines={1}
              style={[
                styles.valueText,
                { color: selectedDateAndTime.time ? colors.text : colors.placeholderText },
              ]}
            >
              {selectedDateAndTime.time
                ? new Date(selectedDateAndTime.time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'TIME'}
            </Text>
          </Pressable>
        </View>

        {/* Buffer Field */}
        <View style={styles.fieldCol}>
          <Text style={[styles.label, { color: colors.text }]}>Buffer Time:</Text>
          <Pressable
            onPress={onBufferPress}
            style={[styles.fieldBox, { backgroundColor: colors.scheduleReminderCardBackground }]}
          >
            <Image tintColor={themeColor} source={AssetsPath.ic_timerClock} style={styles.icon} />
            <Text numberOfLines={1} style={[styles.valueText, { color: colors.placeholderText }]}>
              {bufferMinutes > 0 ? `${bufferMinutes}m` : 'TIME'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 5,
    marginBottom: 15,
  },
  title: {
    fontSize: 19,
    fontFamily: FONTS.Medium,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    columnGap: 8,
  },
  fieldCol: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
    marginBottom: 6,
  },
  fieldBox: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    justifyContent: 'center',
    columnGap: 6,
  },
  icon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  valueText: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
});

export default AlarmScheduleRow;

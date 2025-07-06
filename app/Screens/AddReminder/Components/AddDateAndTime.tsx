import React, { FC } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import AssetsPath from '../../../Constants/AssetsPath';
import TextString from '../../../Constants/TextString';
import { FONTS, SIZE } from '../../../Constants/Theme';
import useThemeColors from '../../../Hooks/useThemeMode';

interface AddDateAndTimeProps {
  themeColor: string;
  onDatePress: () => void;
  onTimePress: () => void;
  selectedDateAndTime: { date: Date | undefined; time: Date | undefined };
}

const AddDateAndTime: FC<AddDateAndTimeProps> = ({
  themeColor,
  onDatePress,
  onTimePress,
  selectedDateAndTime,
}) => {
  const colors = useThemeColors();

  return (
    <View style={[styles.container]}>
      <Text style={[styles.titleText, { color: colors.text }]}>{TextString.Schedule}:</Text>

      <View style={styles.flexView}>
        <View style={styles.dateAndTimeView}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Date:</Text>
          <Pressable
            onPress={onDatePress}
            style={[
              styles.dateAndTimeFlexView,
              { backgroundColor: colors.scheduleReminderCardBackground },
            ]}
          >
            <Image tintColor={themeColor} style={styles.icon} source={AssetsPath.ic_calender} />
            <Text
              numberOfLines={1}
              style={[
                styles.valueText,
                {
                  color: selectedDateAndTime?.date ? colors.text : colors.placeholderText,
                },
              ]}
            >
              {selectedDateAndTime?.date
                ? new Date(selectedDateAndTime.date).toLocaleDateString()
                : 'DD / MM / YY'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.dateAndTimeView}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Time:</Text>
          <Pressable
            onPress={onTimePress}
            style={[
              styles.dateAndTimeFlexView,
              { backgroundColor: colors.scheduleReminderCardBackground },
            ]}
          >
            <Image tintColor={themeColor} style={styles.icon} source={AssetsPath.ic_time} />
            <Text
              numberOfLines={1}
              style={[
                styles.valueText,
                {
                  color: selectedDateAndTime?.time ? colors.text : colors.placeholderText,
                },
              ]}
            >
              {selectedDateAndTime?.time
                ? new Date(selectedDateAndTime.time).toLocaleTimeString()
                : 'Time'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default AddDateAndTime;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  titleText: {
    fontFamily: FONTS.Medium,
    fontSize: 19,
  },
  flexView: {
    width: '100%',
    marginVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateAndTimeView: {
    width: '48%',
    marginVertical: 5,
  },
  mainTitle: {
    fontSize: 16,
    fontFamily: FONTS.Regular,
  },
  dateAndTimeFlexView: {
    height: 50,
    width: '100%',
    columnGap: 10,
    marginVertical: 10,
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZE.listBorderRadius,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  valueText: {
    fontFamily: FONTS.Medium,
    fontSize: 16.5,
  },
});

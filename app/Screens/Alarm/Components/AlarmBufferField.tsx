import AssetsPath from '@Constants/AssetsPath';
import { FONTS, SIZE } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const BUFFER_OPTIONS = [0, 5, 10, 15];

interface AlarmBufferFieldProps {
  value: number;
  onChange: (value: number) => void;
  themeColor: string;
}

const AlarmBufferField: React.FC<AlarmBufferFieldProps> = ({ value, onChange, themeColor }) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Buffer Time:</Text>
      <View style={styles.row}>
        {BUFFER_OPTIONS.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[
                styles.option,
                {
                  backgroundColor: colors.scheduleReminderCardBackground,
                  borderColor: selected ? themeColor : 'transparent',
                },
              ]}
            >
              <Image source={AssetsPath.ic_time} tintColor={themeColor} style={styles.icon} />
              <Text
                style={[styles.value, { color: selected ? colors.text : colors.placeholderText }]}
              >
                {option === 0 ? 'TIME' : `${option}m`}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: FONTS.Regular,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    columnGap: 8,
  },
  option: {
    flex: 1,
    height: 50,
    borderRadius: SIZE.listBorderRadius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 8,
    borderWidth: 1.5,
  },
  icon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  value: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
});

export default AlarmBufferField;

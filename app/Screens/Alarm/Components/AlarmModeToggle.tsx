import AssetsPath from '@Constants/AssetsPath';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import { AlarmMode } from '@Types/Alarm';

interface AlarmModeToggleProps {
  mode: AlarmMode;
  onChange: (mode: AlarmMode) => void;
}

const AlarmModeToggle: React.FC<AlarmModeToggleProps> = ({ mode, onChange }) => {
  const colors = useThemeColors();

  const renderItem = (itemMode: AlarmMode, icon: any, label: string) => {
    const active = mode === itemMode;

    return (
      <Pressable key={itemMode} onPress={() => onChange(itemMode)} style={styles.item}>
        <Image
          source={icon}
          style={[styles.icon, { opacity: active ? 1 : 0.25 }]}
          tintColor={undefined}
        />
        <Text
          style={[
            styles.label,
            { color: active ? colors.text : colors.grayTitle, opacity: active ? 1 : 0.45 },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {renderItem('solo', AssetsPath.ic_soloAlarm, 'Solo')}
      {renderItem('group', AssetsPath.ic_groupAlarm, 'Group')}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 26,
    marginTop: 8,
    marginBottom: 16,
  },
  item: {
    alignItems: 'center',
    rowGap: 8,
  },
  icon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
  },
});

export default AlarmModeToggle;

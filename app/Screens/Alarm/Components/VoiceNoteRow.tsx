import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface VoiceNoteRowProps {
  label: string;
  active: boolean;
  playing: boolean;
  backgroundColor: string;
  textColor: string;
  onPress: () => void;
}

const VoiceNoteRow: React.FC<VoiceNoteRowProps> = ({
  label,
  active,
  playing,
  backgroundColor,
  textColor,
  onPress,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${playing ? 'Pause' : 'Play'} ${label}`}
    onPress={onPress}
    style={[styles.row, { backgroundColor }, active && styles.active]}
  >
    <Text numberOfLines={1} style={[styles.label, { color: textColor }]}>
      {label}
    </Text>
    <View style={styles.playButton}>
      <Image
        source={playing ? AssetsPath.ic_pause : AssetsPath.ic_play}
        style={styles.playIcon}
        tintColor={textColor}
      />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    height: 42,
    borderRadius: 8,
    paddingLeft: 14,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  active: {
    borderWidth: 1,
    borderColor: '#B4C2FF',
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.Medium,
  },
  playButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 15,
    height: 15,
    resizeMode: 'contain',
  },
});

export default VoiceNoteRow;

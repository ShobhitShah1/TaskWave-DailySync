import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

interface VoiceNoteRowProps {
  label: string;
  active: boolean;
  playing: boolean;
  durationMillis: number;
  loading: boolean;
  positionMillis: number;
  backgroundColor: string;
  textColor: string;
  onPress: () => void;
}

const formatDuration = (durationMillis: number) => {
  const totalSeconds = Math.max(0, Math.floor(durationMillis / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const VoiceNoteRow: React.FC<VoiceNoteRowProps> = ({
  label,
  active,
  playing,
  durationMillis,
  loading,
  positionMillis,
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
    <View style={styles.details}>
      <Text numberOfLines={1} style={[styles.label, { color: textColor }]}>
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" style={styles.loader} />
      ) : (
        <Text style={[styles.duration, { color: textColor }]}>
          {formatDuration(positionMillis)} / {formatDuration(durationMillis)}
        </Text>
      )}
    </View>
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
    minHeight: 50,
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
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
  },
  duration: {
    fontSize: 10,
    fontFamily: FONTS.Regular,
    marginTop: 2,
    opacity: 0.65,
  },
  loader: {
    alignSelf: 'flex-start',
    marginTop: 2,
    transform: [{ scale: 0.7 }],
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

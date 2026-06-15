import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';

import AssetsPath from '@Constants/AssetsPath';
import { FONTS, SIZE } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { useAudioQueue } from '@Hooks/useAudioQueue';
import useThemeColors from '@Hooks/useThemeMode';
import { Memo } from '@Types/Interface';

const AudioMemoItem = ({
  memo,
  themeColor,
  renderRightIcon,
  gradientStart = '#FF6B6B',
  gradientEnd = '#4ECDC4',
  memoContainerStyle,
}: {
  memo: Memo;
  themeColor: string;
  renderRightIcon: React.ReactNode;
  gradientStart?: string;
  gradientEnd?: string;
  memoContainerStyle?: StyleProp<ViewStyle>;
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const uris = useMemo(() => (memo.uri ? [memo.uri] : []), [memo.uri]);
  const player = useAudioQueue(uris);

  const getColorForIndex = (index: number, totalLines: number) => {
    const progress = index / totalLines;
    return interpolateColor(progress, [0, 1], [gradientStart, gradientEnd]);
  };

  const playSound = async () => {
    await player.toggle();
  };

  const formatMillis = (millis: number) => {
    const minutes = Math.floor(millis / (1000 * 60));
    const seconds = Math.floor((millis % (1000 * 60)) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const calculateWaveformData = (metering: number[]) => {
    const numLines = 50;
    const lines: { value: number; color: string }[] = [];
    if (!metering || metering.length === 0) return lines;
    for (let i = 0; i < numLines; i++) {
      const meteringIndex = Math.floor((i * metering.length) / numLines);
      const nextMeteringIndex = Math.ceil(((i + 1) * metering.length) / numLines);
      const values = metering.slice(meteringIndex, nextMeteringIndex);
      const average = values.reduce((sum, a) => sum + a, 0) / values.length;
      lines.push({ value: average, color: getColorForIndex(i, numLines) });
    }
    return lines;
  };

  const isPlaying = player.isPlaying;
  const position = player.positionMillis;
  const duration = player.durationMillis || player.durationsMillis[0] || 0;

  const progress = position / (duration || 1);

  const fallbackMetering = useMemo(() => {
    if (memo.metering && memo.metering.length > 0) return memo.metering;
    // Generate a pleasant looking static waveform for files without metering data
    return Array.from({ length: 50 }, (_, i) => {
      const val = Math.sin(i * 0.4) * 15 - 20;
      return val - Math.random() * 8;
    });
  }, [memo.metering]);

  const waveformData = calculateWaveformData(fallbackMetering);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    left: `${progress * 100}%`,
  }));

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.scheduleReminderCardBackground },
          memoContainerStyle,
        ]}
      >
        {memo.uri && (
          <Pressable onPress={playSound}>
            <Image
              tintColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(91, 87, 87, 0.7)'}
              resizeMode="contain"
              source={isPlaying ? AssetsPath.ic_pause : AssetsPath.ic_play}
              style={{ width: 20, height: 20 }}
            />
          </Pressable>
        )}

        <View style={styles.playbackContainer}>
          {memo.uri && (
            <View style={styles.wave}>
              {waveformData.map((db, index) => (
                <View
                  key={index}
                  style={[
                    styles.waveLine,
                    {
                      height: interpolate(db.value, [-50, 0], [5, 40], Extrapolation.CLAMP),
                      backgroundColor:
                        progress > index / waveformData.length
                          ? db.color // Use gradient color when played
                          : theme === 'dark'
                            ? 'rgba(255, 255, 255, 0.3)'
                            : 'rgba(91, 87, 87, 0.3)',
                    },
                  ]}
                />
              ))}
            </View>
          )}
          {memo.uri && (
            <Animated.View
              style={[
                styles.playbackIndicator,
                { backgroundColor: themeColor },
                animatedIndicatorStyle,
              ]}
            />
          )}
        </View>
        <View>{renderRightIcon}</View>
      </View>
      {memo.uri &&
        ((player.durationLoading[0] ?? true) ? (
          <ActivityIndicator color={themeColor} size="small" style={styles.durationLoader} />
        ) : (
          <Text style={[styles.durationText, { color: colors.text }]}>
            {formatMillis(position)} / {formatMillis(duration)}
          </Text>
        ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 15,
    padding: 10,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: SIZE.listBorderRadius,
  },
  playbackContainer: {
    flex: 1,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  playbackBackground: {
    height: 3,
    backgroundColor: 'gainsboro',
    borderRadius: 5,
  },
  playbackIndicator: {
    width: 10,
    aspectRatio: 1,
    borderRadius: 10,
    position: 'absolute',
  },
  wave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveLine: {
    flex: 1,
    height: 30,
    backgroundColor: 'gainsboro',
    borderRadius: 20,
  },
  durationText: {
    marginTop: 10,
    fontFamily: FONTS.Medium,
    textAlign: 'right',
    fontSize: 12,
  },
  durationLoader: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
});

export default AudioMemoItem;

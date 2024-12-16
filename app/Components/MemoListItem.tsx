import { AVPlaybackStatus, Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import React, { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useAppContext } from "../Contexts/ThemeProvider";
import AssetsPath from "../Constants/AssetsPath";
import { FONTS, SIZE } from "../Constants/Theme";
import useThemeColors from "../Hooks/useThemeMode";
import { Memo } from "../Types/Interface";

const AudioMemoItem = ({
  memo,
  themeColor,
  renderRightIcon,
}: {
  memo: Memo;
  themeColor: string;
  renderRightIcon: React.ReactNode;
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const [sound, setSound] = useState<Sound>();
  const [status, setStatus] = useState<AVPlaybackStatus>();

  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        { uri: memo.uri },
        { progressUpdateIntervalMillis: 1000 / 60 },
        onPlaybackStatusUpdate
      );
      setSound(sound);
    };

    if (memo.uri) {
      loadSound();
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [memo]);

  const onPlaybackStatusUpdate = useCallback(
    async (newStatus: AVPlaybackStatus) => {
      setStatus(newStatus);
      if (newStatus.isLoaded && sound && newStatus.didJustFinish) {
        await sound.setPositionAsync(0);
      }
    },
    [sound]
  );

  const playSound = async () => {
    if (!sound) return;

    status?.isLoaded && status.isPlaying
      ? await sound.pauseAsync()
      : await sound.replayAsync();
  };

  const formatMillis = (millis: number) => {
    const minutes = Math.floor(millis / (1000 * 60));
    const seconds = Math.floor((millis % (1000 * 60)) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const calculateWaveformData = (metering: number[]) => {
    const numLines = 50;
    const lines = [];
    for (let i = 0; i < numLines; i++) {
      const meteringIndex = Math.floor((i * metering.length) / numLines);
      const nextMeteringIndex = Math.ceil(
        ((i + 1) * metering.length) / numLines
      );
      const values = metering.slice(meteringIndex, nextMeteringIndex);
      const average = values.reduce((sum, a) => sum + a, 0) / values.length;
      lines.push(average);
    }
    return lines;
  };

  const isPlaying = status?.isLoaded ? status.isPlaying : false;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis : 1;

  const progress = position / (duration || 1);
  const waveformData = memo.metering
    ? calculateWaveformData(memo.metering)
    : [];

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    left: `${progress * 100}%`,
  }));

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.scheduleReminderCardBackground },
        ]}
      >
        {memo.uri && (
          <Pressable onPress={playSound}>
            <Image
              tintColor={
                theme === "dark"
                  ? "rgba(255, 255, 255, 0.7)"
                  : "rgba(91, 87, 87, 0.7)"
              }
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
                      height: interpolate(
                        db,
                        [-50, 0],
                        [5, 40],
                        Extrapolation.CLAMP
                      ),
                      backgroundColor:
                        progress > index / waveformData.length
                          ? themeColor
                          : theme === "dark"
                          ? "rgba(255, 255, 255, 0.7)"
                          : "rgba(91, 87, 87, 0.7)",
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
      {memo.uri && (
        <Text
          style={{
            marginTop: 10,
            fontFamily: FONTS.Medium,
            textAlign: "right",
            color: colors.text,
            fontSize: 12,
          }}
        >
          {formatMillis(position || 0)} / {formatMillis(duration || 0)}
        </Text>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 15,
    padding: 10,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: SIZE.listBorderRadius,
  },
  playbackContainer: {
    flex: 1,
    paddingVertical: 20,
    justifyContent: "center",
  },
  playbackBackground: {
    height: 3,
    backgroundColor: "gainsboro",
    borderRadius: 5,
  },
  playbackIndicator: {
    width: 10,
    aspectRatio: 1,
    borderRadius: 10,
    position: "absolute",
  },
  wave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  waveLine: {
    flex: 1,
    height: 30,
    backgroundColor: "gainsboro",
    borderRadius: 20,
  },
});

export default AudioMemoItem;

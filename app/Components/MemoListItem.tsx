import { AVPlaybackStatus, Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolate,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import AssetsPath from "../Global/AssetsPath";
import { SIZE } from "../Global/Theme";
import useThemeColors from "../Theme/useThemeMode";

export type Memo = {
  uri: string;
  metering: number[];
};

const MemoListItem = ({ memo }: { memo: Memo }) => {
  const colors = useThemeColors();

  const [sound, setSound] = useState<Sound>();
  const [status, setStatus] = useState<AVPlaybackStatus>();

  async function loadSound() {
    const { sound } = await Audio.Sound.createAsync(
      { uri: memo.uri },
      { progressUpdateIntervalMillis: 1000 / 60 },
      onPlaybackStatusUpdate
    );
    setSound(sound);
  }

  const onPlaybackStatusUpdate = useCallback(
    async (newStatus: AVPlaybackStatus) => {
      setStatus(newStatus);

      if (!newStatus.isLoaded || !sound) {
        return;
      }

      if (newStatus.didJustFinish) {
        await sound?.setPositionAsync(0);
      }
    },
    [sound]
  );

  useEffect(() => {
    loadSound();
  }, [memo]);

  async function playSound() {
    if (!sound) {
      return;
    }
    if (status?.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.replayAsync();
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const formatMillis = (millis: number) => {
    const minutes = Math.floor(millis / (1000 * 60));
    const seconds = Math.floor((millis % (1000 * 60)) / 1000);

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const isPlaying = status?.isLoaded ? status.isPlaying : false;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis : 1;

  const progress = position / (duration || 0);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    left: `${progress * 100}%`,
    // withTiming(`${progress * 100}%`, {
    //   duration:
    //     (status?.isLoaded && status.progressUpdateIntervalMillis) || 100,
    // }),
  }));

  let numLines = 50;
  let lines = [];

  for (let i = 0; i < numLines; i++) {
    const meteringIndex = Math.floor((i * memo.metering.length) / numLines);
    const nextMeteringIndex = Math.ceil(
      ((i + 1) * memo.metering.length) / numLines
    );
    const values = memo.metering.slice(meteringIndex, nextMeteringIndex);
    const average = values.reduce((sum, a) => sum + a, 0) / values.length;
    // lines.push(memo.metering[meteringIndex]);
    lines.push(average);
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.reminderCardBackground },
      ]}
    >
      <Pressable onPress={playSound}>
        <Image
          tintColor={"rgba(255, 255, 255, 0.7)"}
          resizeMode="contain"
          source={isPlaying ? AssetsPath.ic_play : AssetsPath.ic_play}
          style={{ width: 20, height: 20 }}
        />
      </Pressable>

      <View style={styles.playbackContainer}>
        <View style={styles.wave}>
          {lines.map((db, index) => (
            <View
              key={index}
              style={[
                styles.waveLine,
                {
                  height: interpolate(
                    db,
                    [-60, 0],
                    [5, 50],
                    Extrapolation.CLAMP
                  ),
                  backgroundColor:
                    progress > index / lines.length ? "royalblue" : "gainsboro",
                },
              ]}
            />
          ))}
        </View>

        {/* <Animated.View
          style={[styles.playbackIndicator, animatedIndicatorStyle]}
        /> */}

        {/* <Text
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            color: "gray",
            fontFamily: "Inter",
            fontSize: 12,
          }}
        >
          {formatMillis(position || 0)} / {formatMillis(duration || 0)}
        </Text> */}
      </View>

      <Pressable onPress={playSound}>
        <Image
          resizeMode="contain"
          // tintColor={}
          source={AssetsPath.ic_recordMic}
          style={{ width: 25, height: 25 }}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 15,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
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
    backgroundColor: "royalblue",
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

export default MemoListItem;

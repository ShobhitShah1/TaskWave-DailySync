import { Audio } from "expo-av";
import { Recording } from "expo-av/build/Audio";
import { memo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import MemoListItem, { Memo } from "./MemoListItem";

const RecordAudio = () => {
  const [recording, setRecording] = useState<Recording>();
  const [memos, setMemos] = useState<Memo[]>([]);

  const [audioMetering, setAudioMetering] = useState<number[]>([]);
  const metering = useSharedValue(-100);

  async function startRecording() {
    try {
      setAudioMetering([]);

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100
      );
      setRecording(recording);

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering) {
          metering.value = status.metering;
          setAudioMetering((curVal) => [...curVal, status.metering || -100]);
        }
      });
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    if (!recording) {
      return;
    }

    console.log("Stopping recording..");
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);
    metering.value = -100;
    if (uri) {
      setMemos((existingMemos) => [
        { uri, metering: audioMetering },
        ...existingMemos,
      ]);
    }
  }

  const animatedRedCircle = useAnimatedStyle(() => ({
    width: withTiming(recording ? "60%" : "100%"),
    borderRadius: withTiming(recording ? 5 : 35),
  }));

  const animatedRecordWave = useAnimatedStyle(() => {
    const size = withTiming(
      interpolate(metering.value, [-160, -60, 0], [0, 0, -30]),
      { duration: 100 }
    );
    return {
      top: size,
      bottom: size,
      left: size,
      right: size,
      backgroundColor: `rgba(255, 45, 0, ${interpolate(
        metering.value,
        [-160, -60, -10],
        [0.7, 0.3, 0.7]
      )})`,
    };
  });

  return (
    <View style={styles.container}>
      {memos?.length !== 0 ? (
        <FlatList
          data={memos}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => <MemoListItem memo={item} />}
        />
      ) : (
        <View style={styles.footer}>
          <View>
            <Animated.View style={[styles.recordWave, animatedRecordWave]} />
            <Pressable
              style={styles.recordButton}
              onPress={recording ? stopRecording : startRecording}
            >
              <Animated.View style={[styles.redCircle, animatedRedCircle]} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

export default memo(RecordAudio);

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    marginBottom: 20,
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    width: 35,
    height: 35,
    borderRadius: 35,

    borderWidth: 3,
    borderColor: "gray",
    padding: 3,

    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  recordWave: {
    position: "absolute",
    top: -20,
    bottom: -20,
    left: -20,
    right: -20,
    borderRadius: 1000,
  },

  redCircle: {
    backgroundColor: "orangered",
    aspectRatio: 1,
  },
});

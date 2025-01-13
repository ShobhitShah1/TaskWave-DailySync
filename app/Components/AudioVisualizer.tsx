import { Audio } from "expo-av";
import React, { memo, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

interface AudioVisualizerProps {
  uri: string;
  isPlaying: boolean;
  theme: "light" | "dark";
}

const NUM_BARS = 25;
const BAR_WIDTH = 2;
const BAR_GAP = 2;
const MAX_BAR_HEIGHT = 40;

const AudioVisualizer = memo(
  ({ uri, isPlaying, theme }: AudioVisualizerProps) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    const barHeights = Array(NUM_BARS)
      .fill(0)
      .map(() => useSharedValue(0));

    useEffect(() => {
      const setupAudio = async () => {
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri },
            { shouldPlay: false }
          );
          setSound(newSound);
        } catch (error) {
          console.error("Error setting up audio:", error);
        }
      };

      setupAudio();
      return () => {
        sound?.unloadAsync();
      };
    }, [uri]);

    const animateBars = () => {
      barHeights.forEach((height) => {
        const randomHeight = Math.random() * MAX_BAR_HEIGHT;
        height.value = withSpring(randomHeight, {
          mass: 0.5,
          damping: 12,
          stiffness: 150,
        });
      });
    };

    useEffect(() => {
      if (isPlaying && sound) {
        sound.playAsync();
        animateBars();
      } else {
        sound?.pauseAsync();
        barHeights.forEach((height) => {
          height.value = withSpring(0);
        });
      }
    }, [isPlaying, animateBars]);

    return (
      <View style={styles.container}>
        {barHeights.map((height, index) => {
          const animatedStyle = useAnimatedStyle(() => ({
            height: height.value,
          }));
          return (
            <Animated.View
              key={index}
              style={[
                styles.bar,
                {
                  backgroundColor:
                    theme === "dark" ? "#2196F3" : "rgba(33, 150, 243, 0.8)",
                  marginHorizontal: BAR_GAP / 2,
                },
                animatedStyle,
              ]}
            />
          );
        })}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: MAX_BAR_HEIGHT,
    paddingHorizontal: 8,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
    backgroundColor: "#2196F3",
  },
});

export default AudioVisualizer;

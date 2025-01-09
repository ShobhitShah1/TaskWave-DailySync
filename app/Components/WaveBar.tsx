import React from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface WaveBarProps {
  delay: number;
}

const WaveBar = ({ delay }: WaveBarProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    height: withRepeat(
      withSequence(
        withTiming(16, { duration: 500 }),
        withTiming(4, { duration: 500 })
      ),
      -1,
      true
    ),
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          backgroundColor: "#2196F3",
          borderRadius: 1.5,
        },
        animatedStyle,
      ]}
    />
  );
};

export default WaveBar;

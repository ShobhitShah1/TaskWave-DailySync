import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Animated as RNAnimated, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Sound } from '@Types/Interface';
import styles from '../styles';

interface SoundItemProps {
  item: Sound;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

const SoundItem = ({ item, isSelected, isPlaying, onSelect, onPlay }: SoundItemProps) => {
  const style = styles();
  const scaleButton = useSharedValue(1);
  const [animationsReady, setAnimationsReady] = useState(false);

  const waveAnimation = useRef<{ [key: string]: RNAnimated.Value[] }>({});

  useEffect(() => {
    waveAnimation.current[item.id] = Array(5)
      .fill(0)
      .map(() => new RNAnimated.Value(0));
    setAnimationsReady(true);
  }, []);

  const animateWaves = (soundId: string) => {
    const waves = waveAnimation.current[soundId];
    if (!waves) return;

    waves.forEach((anim, i) => {
      RNAnimated.sequence([
        RNAnimated.delay(i * 100),
        RNAnimated.loop(
          RNAnimated.sequence([
            RNAnimated.timing(anim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            RNAnimated.timing(anim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ),
      ]).start();
    });
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleButton.value }],
  }));

  const animateButton = useCallback(() => {
    scaleButton.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1, { damping: 4 }),
    );
  }, []);

  const handlePlay = () => {
    animateButton();
    onPlay();
    animateWaves(item.id);
  };

  return (
    <Pressable onPress={onSelect} style={[style.soundCard, isSelected && style.selectedCard]}>
      <View style={style.cardContent}>
        {item.canPlay && (
          <Animated.View style={[style.playButtonContainer, buttonStyle]}>
            <Pressable
              style={[style.playButton, isPlaying && style.playingButton]}
              onPress={handlePlay}
            >
              <Text style={[style.playButtonText, isPlaying && style.playingButtonText]}>
                {isPlaying ? '■' : '▶'}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={style.soundInfo}>
          <Text style={style.soundName}>{item.name}</Text>
          {item.canPlay && (
            <View style={style.durationContainer}>
              <Text style={style.duration}>{item.duration}</Text>
              {item.category && (
                <View style={style.categoryBadge}>
                  <Text style={style.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={style.rightSection}>
          {isPlaying &&
            item.canPlay &&
            waveAnimation.current[item.id]?.map((anim, index) => (
              <RNAnimated.View
                key={index}
                style={[
                  style.waveBar,
                  {
                    transform: [
                      {
                        scaleY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            ))}
          {isSelected && <View style={style.selectedIndicator} />}
        </View>
      </View>
    </Pressable>
  );
};

export default memo(SoundItem);

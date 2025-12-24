import { Sound } from '@Types/Interface';
import { memo, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import styles from '../styles';

interface SoundItemProps {
  item: Sound;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPlay: () => void;
}

const WaveBar = ({ index, isPlaying }: { index: number; isPlaying: boolean }) => {
  const style = styles();
  const scale = useSharedValue(0.3);

  useEffect(() => {
    if (isPlaying) {
      scale.value = withDelay(
        index * 100,
        withRepeat(
          withSequence(withTiming(1, { duration: 500 }), withTiming(0.3, { duration: 500 })),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(0.3, { duration: 200 });
    }
  }, [isPlaying, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return <Animated.View style={[style.waveBar, animatedStyle]} />;
};

const SoundItem = ({ item, isSelected, isPlaying, onSelect, onPlay }: SoundItemProps) => {
  const style = styles();

  return (
    <Pressable onPress={onSelect} style={[style.soundCard, isSelected && style.selectedCard]}>
      <View style={style.cardContent}>
        {item.canPlay && (
          <View style={style.playButtonContainer}>
            <Pressable
              style={[style.playButton, isPlaying && style.playingButton]}
              onPress={onPlay}
            >
              <Text style={[style.playButtonText, isPlaying && style.playingButtonText]}>
                {isPlaying ? '■' : '▶'}
              </Text>
            </Pressable>
          </View>
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
          {isPlaying && item.canPlay && (
            <>
              {[0, 1, 2, 3, 4].map((index) => (
                <WaveBar key={index} index={index} isPlaying={isPlaying} />
              ))}
            </>
          )}
          {isSelected && <View style={style.selectedIndicator} />}
        </View>
      </View>
    </Pressable>
  );
};

export default memo(SoundItem);

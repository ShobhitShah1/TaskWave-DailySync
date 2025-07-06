import React, { memo, useEffect } from 'react';
import { Image, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useAppContext } from '../../../Contexts/ThemeProvider';
import { NotificationType } from '../../../Types/Interface';
import styles from '../styles';

interface FilterButtonProps {
  data: any;
  selectedFilter: NotificationType | 'all';
  onPress: () => void;
  backgroundColor: string;
}

export const FilterButton = memo(({ onPress, data, selectedFilter }: FilterButtonProps) => {
  const style = styles();
  const { theme } = useAppContext();

  const isSelected = selectedFilter === data?.type;
  const scale = useSharedValue(isSelected ? 1.05 : 1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    scale.value = withSpring(isSelected ? 1.05 : 1);
  }, [isSelected]);

  return (
    <Pressable onPress={onPress} style={{ right: 2, overflow: 'visible' }}>
      <Animated.View
        style={[
          style.filterBtn,
          {
            shadowColor: isSelected ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: isSelected ? 2 : 0 },
            shadowOpacity: isSelected ? 0.3 : 0,
            shadowRadius: isSelected ? 4 : 0,
            opacity: theme === 'dark' && isSelected ? 1 : theme === 'light' ? 1 : 0.5,
          },
          animatedStyle,
        ]}
      >
        <Image
          source={isSelected ? data?.glowIcon : data?.icon}
          style={[
            style.filterIcon,
            {
              width: isSelected ? '155%' : '150%',
              height: isSelected ? '155%' : '150%',
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
});

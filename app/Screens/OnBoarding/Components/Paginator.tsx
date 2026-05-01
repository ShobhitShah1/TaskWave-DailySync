import React, { FC, memo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
} from 'react-native-reanimated';

import useThemeColors from '@Hooks/useThemeMode';

interface PaginatorProps {
  data: any[];
  scrollX: SharedValue<number>;
}

const DOT_SIZE = 11;

interface DotProps {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}

const Dot: FC<DotProps> = memo(({ index, scrollX, width }) => {
  const style = styles();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);

    const backgroundColor = interpolateColor(scrollX.value, inputRange, [
      'rgba(217, 217, 217, 1)',
      'rgba(64, 93, 240, 1)',
      'rgba(217, 217, 217, 1)',
    ]);

    return {
      opacity,
      backgroundColor,
    };
  });

  return <Animated.View style={[style.Dot, animatedStyle]} />;
});

const Paginator: FC<PaginatorProps> = ({ data, scrollX }) => {
  const { width } = useWindowDimensions();
  const style = styles();

  return (
    <View style={style.container}>
      {data.map((_, i) => (
        <Dot key={i.toString()} index={i} scrollX={scrollX} width={width} />
      ))}
    </View>
  );
};

export default memo(Paginator);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      justifyContent: 'center',
      flexDirection: 'row',
    },
    Dot: {
      height: DOT_SIZE,
      width: DOT_SIZE,
      borderRadius: 50,
      backgroundColor: colors.grayTitle,
      marginHorizontal: 4,
    },
  });
};

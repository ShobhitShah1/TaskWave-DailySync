import React, { FC, memo } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";
import useThemeColors from "../../../Theme/useThemeMode";

interface PaginatorProps {
  data: any[];
  scrollX: any;
}

const DOT_SIZE = 11;

const Paginator: FC<PaginatorProps> = ({ data, scrollX }) => {
  const { width } = useWindowDimensions();
  const style = styles();
  const colors = useThemeColors();

  return (
    <View style={style.container}>
      {data.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [DOT_SIZE, DOT_SIZE, DOT_SIZE],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });

        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: [
            "rgba(217, 217, 217, 1)",
            "rgba(64, 93, 240, 1)",
            "rgba(217, 217, 217, 1)",
          ],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            style={[style.Dot, { width: dotWidth, opacity, backgroundColor }]}
            key={i.toString()}
          />
        );
      })}
    </View>
  );
};

export default memo(Paginator);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      justifyContent: "center",
      flexDirection: "row",
    },
    Dot: {
      height: DOT_SIZE,
      borderRadius: 50,
      backgroundColor: colors.grayTitle,
      marginHorizontal: 4,
    },
  });
};

import React, { memo, useMemo } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import AssetsPath from "../../Constants/AssetsPath";
import { FONTS } from "../../Constants/Theme";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useThemeColors from "../../Hooks/useThemeMode";
import { CategoryItemType } from "../../Types/Interface";

const RenderCategoryItem = ({
  item,
  selectedCategory,
  setSelectedCategory,
  onCategoryClick,
}: CategoryItemType) => {
  const colors = useThemeColors();
  const { typeColor } = useNotificationIconColors(item.type);

  const isSelected = useMemo(
    () =>
      selectedCategory &&
      selectedCategory?.toLowerCase() === item?.type?.toLowerCase(),
    [selectedCategory]
  );

  return (
    <Animated.View
      style={[
        styles.pressableContainer,
        {
          borderColor: isSelected
            ? item?.type === "gmail"
              ? item?.color?.dark
              : item?.color?.primary
            : colors.borderColor,
        },
      ]}
      layout={LinearTransition.springify().damping(20).stiffness(300)}
    >
      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          onCategoryClick(item);
          setSelectedCategory(item.type);
        }}
      >
        <ImageBackground
          resizeMode="cover"
          tintColor={
            isSelected
              ? item?.type === "gmail"
                ? item?.color?.dark
                : item?.color?.primary
              : undefined
          }
          source={AssetsPath.ic_categoryFrame}
          style={styles.imageBackground}
        >
          <View style={styles.innerContainer}>
            <View style={styles.iconContainer}>
              <Image
                source={item.icon}
                style={styles.icon}
                resizeMode="contain"
                tintColor={item.type === "gmail" ? undefined : typeColor}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={[styles.titleText, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.descriptionText, { color: colors.text }]}>
                {item.description}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  pressableContainer: {
    width: "48%",
    height: 180,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    justifyContent: "center",
  },
  innerContainer: {
    paddingHorizontal: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 500,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 25,
    height: 25,
  },
  textContainer: {
    marginVertical: 10,
  },
  titleText: {
    fontFamily: FONTS.Medium,
    fontSize: 20,
    marginVertical: 5,
    marginBottom: 10,
  },
  descriptionText: {
    fontFamily: FONTS.Regular,
    fontSize: 14.5,
  },
});

export default memo(RenderCategoryItem);
